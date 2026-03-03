# คู่มือเพิ่ม GitHub Actions Self-Hosted Runner (SmartNote-AI)

> สำหรับ repository สาธารณะ แนะนำให้ใช้ **GitHub-hosted runner** เป็นค่าเริ่มต้น และเปิดใช้ self-hosted runner เฉพาะงานที่จำเป็นจริง ๆ
> เพราะ Pull Request จากโค้ดที่ไม่เชื่อถืออาจทำให้เกิดการรันคำสั่งอันตรายบนเครื่อง runner ได้

## แนวทางความปลอดภัย (สำคัญ)

1. ใช้ **Runner Group** จำกัดสิทธิ์เฉพาะ repository ที่จำเป็น
2. ใส่ **labels** ให้ชัดเจน เช่น `self-hosted`, `windows`, `x64`, `smartnote`
3. จำกัด workflow ที่ใช้ self-hosted เฉพาะ event ที่เชื่อถือได้ เช่น:
   - `workflow_dispatch`
   - `push` ไป branch ภายในองค์กร
   - หลีกเลี่ยงการรันจาก `pull_request` ที่มาจาก fork
4. ไม่เก็บ secret สำคัญไว้บนเครื่อง runner โดยไม่เข้ารหัส
5. ใช้เครื่องแยกเฉพาะ CI และรีเซ็ตสภาพแวดล้อมเป็นระยะ

## ขั้นตอนติดตั้งบน Windows (x64)

```powershell
# 1) Create a folder under drive root
mkdir C:\actions-runner
cd C:\actions-runner

# 2) Download runner package
Invoke-WebRequest -Uri https://github.com/actions/runner/releases/download/v2.332.0/actions-runner-win-x64-2.332.0.zip -OutFile actions-runner-win-x64-2.332.0.zip

# 3) Optional: validate SHA256
if((Get-FileHash -Path actions-runner-win-x64-2.332.0.zip -Algorithm SHA256).Hash.ToUpper() -ne '83E56E05B21EB58C9697F82E52C53B30867335FF039CD5D44D1A1A24D2149F4B'){
  throw 'Computed checksum did not match'
}

# 4) Extract
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory("$PWD/actions-runner-win-x64-2.332.0.zip", "$PWD")
```

### ลงทะเบียนกับ repository

> สร้าง token ใหม่จากหน้า **Settings → Actions → Runners → New self-hosted runner** ทุกครั้งก่อน config
> และ **อย่า commit token ลง repository**

```powershell
# Replace URL and TOKEN with current values from GitHub UI
./config.cmd --url https://github.com/APLOPM/SmartNote-AI --token <RUNNER_REGISTRATION_TOKEN>

# Start runner
./run.cmd
```

## แนะนำให้รันเป็น service

```powershell
./svc install
./svc start
```

## การใช้งานใน workflow

ใช้ labels เพื่อบังคับให้ job ไปลงเครื่อง runner ที่ถูกต้อง:

```yaml
runs-on: [self-hosted, windows, x64, smartnote]
```

ตัวอย่างไฟล์ workflow จริงอยู่ที่:

- `.github/workflows/self-hosted-runner-smoke.yml`

## เช็กลิสต์ก่อนเปิดใช้งานจริง

- [ ] Runner online และเห็น labels ครบ
- [ ] Runner group จำกัดเฉพาะ repo ที่อนุญาต
- [ ] Workflow ไม่รัน self-hosted จาก untrusted fork
- [ ] Secrets ถูกจัดการผ่าน GitHub Secrets/Environment
- [ ] มีแผน patch OS และอัปเดต runner version สม่ำเสมอ
