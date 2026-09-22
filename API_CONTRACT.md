## 1. Create Onboarding Template

### api https://hris.kantorku.id

`POST /api/employees-onboarding/create`

Membuat template onboarding baru.

### Request body

```json
{
  "template_name": "New Hire Onboarding",
  "template_detail": "Template default untuk semua karyawan baru",
  "reminders": [3, 7, 14],
  "is_default": true,
  "general_tasks": [
    {
      "category_name": "Administrasi",
      "tasks": [
        {
          "type": "file",
          "task_name": "Upload KTP",
          "start": { "mode": "on_first_working_day" },
          "deadline": { "mode": "first_working_day_plus_n", "n": 3 },
          "assigned_to": "employee"
        }
      ]
    }
  ],
  "specific_criteria_tasks": [
    {
      "category_name": "Onboarding Finance",
      "criteria": {
        "employment_status": ["permanent", "contract"],
        "branch": ["finance"],
        "department": ["human_resources"],
        "position": ["all"]
      },
      "tasks": [
        {
          "type": "text",
          "task_name": "Isi Nomor Rekening",
          "start": { "mode": "anytime" },
          "deadline": { "mode": "no_deadline" },
          "assigned_to": "employee"
        }
      ]
    }
  ]
}
```

### Response `201 Created`

```json
{
  "id": "tmpl_001",
  "template_name": "New Hire Onboarding",
  "stages_count": 2,
  "approval_workflow": "Default Onboarding Workflow",
  "created_at": "2026-09-21T13:40:00Z"
}
```

### Response `400 Bad Request`

```json
{
  "error": "VALIDATION_ERROR",
  "message": "template_name is required",
  "fields": ["template_name"]
}
```

## 2. Assign Template to Employees

`POST /api/employees-onboarding /onboarding/assign`

Assign template ke banyak karyawan sekaligus.

### Request body

```json
{
  "template_id": "tmpl_001",
  "employee_ids": ["emp_001", "emp_002", "emp_003"]
}
```

### Response `200 OK`

```json
{
  "assigned_count": 3,
  "failed": []
}
```

### Response `207 Multi-Status`

```json
{
  "assigned_count": 2,
  "failed": [
    {
      "employee_id": "emp_003",
      "reason": "already assigned to another active template"
    }
  ]
}
```

## 3. List Onboarding Employees

`GET /api/employees-onboarding/employee_status_tab={status}&page={page}&limit={limit}`

Mengambil data untuk tab `View Per Employee`.

### Query parameters

| Parameter | Type    | Description                                             |
| --------- | ------- | ------------------------------------------------------- |
| `status`  | string  | `in_progress`, `completed`, `ready`, atau `not_started` |
| `search`  | string  | Pencarian nama atau kode karyawan                       |
| `page`    | integer | Nomor halaman                                           |
| `limit`   | integer | Jumlah data per halaman                                 |

### Response `200 OK`

```json
{
  "summary": {
    "in_progress": 0,
    "completed": 0,
    "ready": 0,
    "all_employees": 10
  },
  "data": [
    {
      "employee_id": "emp_001",
      "employee_name": "Budi Santos",
      "employee_code": "EMP-001",
      "branch": "Headquarter",
      "department": "Human Resources",
      "first_working_day": "2026-08-02",
      "nearest_deadline": null,
      "status": "not_started",
      "progress": {
        "completed_tasks": 0,
        "total_tasks": 6
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 10
  }
}
```

## 4. Get Employee Onboarding Tasks

`GET /api/onboarding/employees/{employeeId}/tasks`

Mengambil detail task onboarding per karyawan.

### Response `200 OK`

```json
{
  "employee_id": "emp_001",
  "employee_name": "Budi Santos",
  "template_name": "New Hire Onboarding",
  "first_working_day": "2026-08-02",
  "categories": [
    {
      "category_name": "Administrasi",
      "tasks": [
        {
          "task_id": "task_101",
          "task_name": "Upload KTP",
          "type": "file",
          "status": "not_started",
          "deadline": "2026-08-05",
          "assigned_to": "employee",
          "needs_approval": true,
          "file_url": null
        }
      ]
    }
  ]
}
```

## 5. Update Onboarding Task

`PATCH /api/onboarding/tasks/{taskId}`

Update pengerjaan task oleh employee atau manager.

### Request body: file/image task

```json
{
  "status": "submitted",
  "file_url": "https://storage.kantorku.id/uploads/ktp_budi.pdf"
}
```

### Request body: text task

```json
{
  "status": "submitted",
  "text_value": "1234567890 - Bank BCA"
}
```

### Request body: mark as done task

```json
{
  "status": "completed"
}
```

### Response `200 OK`

```json
{
  "task_id": "task_101",
  "status": "submitted",
  "needs_approval": true,
  "updated_at": "2026-09-21T14:00:00Z"
}
```

## 6. List Tasks Requiring Approval

`GET /api/onboarding/approvals`

Mengambil data untuk tab `Approval Required`.

### Query parameters

| Parameter   | Type    | Description                                                       |
| ----------- | ------- | ----------------------------------------------------------------- |
| `only_mine` | boolean | Jika `true`, hanya task yang membutuhkan approval dari user aktif |

### Response `200 OK`

```json
{
  "data": [
    {
      "task_id": "task_101",
      "employee_name": "Budi Santos",
      "first_working_day": "2026-08-02",
      "task_name": "Upload KTP",
      "task_type": "file",
      "deadline": "2026-08-05",
      "file_url": "https://storage.kantorku.id/uploads/ktp_budi.pdf"
    }
  ]
}
```

## 7. Approve or Reject Task

`POST /api/onboarding/approvals/{taskId}/decision`

Approve atau reject task yang menunggu persetujuan.

### Request body

```json
{
  "decision": "rejected",
  "reason": "Foto KTP buram, mohon upload ulang"
}
```

`decision` harus berupa `approved` atau `rejected`. `reason` wajib diisi ketika decision bernilai `rejected`.

### Response `200 OK`

```json
{
  "task_id": "task_101",
  "status": "rejected",
  "decided_by": "manager_045",
  "decided_at": "2026-09-21T14:10:00Z"
}
```
