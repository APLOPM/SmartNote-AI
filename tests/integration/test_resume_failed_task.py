import pytest
from my_app.agent import AgentTask, ToolExecution, resume_failed_task

# This is a new integration test, and as such, it may require new fixtures or mocks.
# For the purpose of this proposal, we assume the existence of a database fixture `db_session`
# and a mock `tool_executor`.

@pytest.fixture
def failed_task(db_session):
    """Creates a failed multi-step task in the database."""
    # 1. Setup: Create a task with 5 steps
    task = AgentTask.create(goal="Test task", total_steps=5)
    task.add_step(action_name="step_1")
    task.add_step(action_name="step_2")
    failed_step = task.add_step(action_name="step_3_fails")
    task.add_step(action_name="step_4")
    task.add_step(action_name="step_5")

    # Simulate successful completion of the first two steps
    task.steps[0].complete()
    task.steps[1].complete()

    # 2. Simulate a failed ToolExecution for the third step
    ToolExecution.create(
        task_id=task.id,
        step_id=failed_step.id,
        tool_name="failing_tool",
        success=False,
        result={"error": "Tool failed unexpectedly"}
    )

    # Mark the step and the overall task as FAILED
    failed_step.fail()
    task.fail()

    db_session.commit()
    return task.id

def test_resume_failed_multistep_task(failed_task, db_session, tool_executor):
    """
    Tests that a failed multi-step task can be resumed correctly.
    """
    # 1. Action: Resume the failed task
    task_id = failed_task
    resume_failed_task(task_id)

    # 2. Assert: Verify the task is resumed correctly
    resumed_task = db_session.query(AgentTask).get(task_id)

    # Assert that the task status is now RUNNING
    assert resumed_task.status == "RUNNING", "Task status should be updated to RUNNING."

    # Assert that the current step index is the one that failed (index 2)
    assert resumed_task.current_step_index == 2, "Should resume from the failed step."

    # Assert that the failed step is now PENDING, ready to be re-run
    failed_step = resumed_task.steps[2]
    assert failed_step.status == "PENDING", "Failed step status should be reset to PENDING."

    # Assert that a new ToolExecution is triggered for the resumed step
    tool_executor.run.assert_called_once_with(failed_step.action_name)
