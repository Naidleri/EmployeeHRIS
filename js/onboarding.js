class OnboardingTabs {
  constructor() {
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.contentContainer = document.getElementById('tab-content-container');
    this.activeTab = this.getTabFromURL();
    this.init();
  }

  getTabFromURL() {
    const hash = window.location.hash;
    const match = hash.match(/tab=([^&]+)/);
    return match ? match[1] : 'per_employee';
  }

  async loadTab(tabName) {
    try {
      const response = await fetch(`pages/onboarding/${tabName}.html`);
      if (!response.ok) throw new Error('Tab not found');

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      this.contentContainer.innerHTML = doc.body.innerHTML;

      if (typeof window.initPerEmployee === 'function' && tabName === 'per_employee') {
        await window.initPerEmployee();
      }

      if (tabName === 'per_template') {
        document.querySelector('.add-template-btn')?.addEventListener('click', () => {
          window.location.hash = 'onboarding/create';
        });
        await window.initPerTemplate();
      }

      if (tabName === 'approval_required') {
        await window.initApprovalRequired();
      }
    } catch (error) {
      this.contentContainer.innerHTML = '<p>Failed to load tab content.</p>';
      console.error('Failed to load onboarding tab:', error);
    }
  }

  setActiveTab(tabName) {
    this.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    this.loadTab(tabName);
    history.replaceState(null, '', `#onboarding?tab=${tabName}`);
  }

  init() {
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.setActiveTab(btn.dataset.tab));
    });

    this.setActiveTab(this.activeTab);
  }
}

if (typeof window !== 'undefined') {
  window.OnboardingTabs = OnboardingTabs;
}

window.initPerEmployee = async function initPerEmployee() {
  const response = await fetch(`data/onboarding.json?v=${Date.now()}`);
  if (!response.ok) {
    throw new Error(`Failed to load onboarding data: ${response.status}`);
  }

  const data = await response.json();
  const employees = data.employees;

  document.getElementById('count-all').textContent = employees.length;
  document.getElementById('count-in-progress').textContent = data.summary.in_progress;
  document.getElementById('count-completed').textContent = data.summary.completed;
  document.getElementById('count-ready').textContent = data.summary.ready;

  const renderTable = (visibleEmployees) => {
    const tbody = document.getElementById('employee-table-body');
    const empty = document.getElementById('empty-state');

    if (!visibleEmployees.length) {
      tbody.innerHTML = '';
      empty.style.display = 'flex';
      return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = visibleEmployees.map((employee) => `
      <tr data-employee-id="${employee.employee_id}">
        <td>
          <div class="employee-cell">
            <div class="avatar">${employee.employee_name.split(' ').map((name) => name[0]).join('').slice(0, 2)}</div>
            <div>
              <div class="employee-name">${employee.employee_name}</div>
              <div class="employee-meta">${employee.employee_code} • ${employee.branch} • ${employee.department}</div>
            </div>
          </div>
        </td>
        <td>${employee.first_working_day}</td>
        <td>${employee.nearest_deadline || 'N/A'}</td>
        <td>
          <div class="progress-wrapper">
            <span class="progress-label">${employee.status.replace('_', ' ')}</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${employee.progress.total_tasks ? (employee.progress.completed_tasks / employee.progress.total_tasks) * 100 : 0}%"></div>
            </div>
          </div>
        </td>
        <td>
          <div class="action-cell">
            <button class="action-btn" title="Remind" aria-label="Remind">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            </button>
            <button class="action-btn" title="View Detail" aria-label="View Detail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    tbody.addEventListener('click', (event) => {
      const row = event.target.closest('tr[data-employee-id]');
      if (!row) return;

      const employee = employees.find((item) => item.employee_id === row.dataset.employeeId);
      if (!employee) return;

      if (event.target.closest('button[title="View Detail"]') || !event.target.closest('button')) {
        renderEmployeeDetail(employee);
      }
    });
  };

  const renderEmployeeDetail = (employee) => {
    document.getElementById('tab-content-container').innerHTML = `
      <section class="employee-detail-view">
        <div class="detail-header">
          <button class="detail-close" type="button" aria-label="Close detail">&times;</button>
        </div>
        <div class="detail-layout">
          <div class="detail-sidebar">
            <h2>Onboarding Detail</h2>
            <div class="detail-card detail-summary">
              <div class="detail-row"><span>Template</span><strong>-</strong></div>
              <div class="detail-row"><span>Progress</span><strong>${employee.status.replace('_', ' ')}</strong></div>
              <div class="detail-progress"><span style="width:${employee.progress.total_tasks ? (employee.progress.completed_tasks / employee.progress.total_tasks) * 100 : 0}%"></span></div>
            </div>

            <h2>Employee Info</h2>
            <div class="detail-card employee-info">
              <div class="detail-row"><span>Full Name</span><strong>${employee.employee_name}</strong></div>
              <div class="detail-row"><span>Employee ID</span><strong>${employee.employee_code}</strong></div>
              <div class="detail-row"><span>Direct Manager</span><strong>N/A</strong></div>
              <div class="detail-row"><span>Employment Status</span><strong>Permanent</strong></div>
              <div class="detail-row"><span>Start Date</span><strong>${employee.first_working_day}</strong></div>
              <div class="detail-row"><span>Branch</span><strong>${employee.branch}</strong></div>
              <div class="detail-row"><span>Department</span><strong>${employee.department}</strong></div>
              <div class="detail-row"><span>Position</span><strong>Coming Soon</strong></div>
            </div>
          </div>

          <div class="task-panel">
            <div class="task-panel-header">
              <h2>Task List</h2>
              <button class="add-task-btn" type="button">+&nbsp; Add Task</button>
            </div>
            <div class="task-toolbar">
              <div class="search-wrapper">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input class="search-input" type="search" placeholder="Search task here">
              </div>
              <button class="filter-btn" type="button">Filter</button>
            </div>
            <div class="task-table-header"><span>Task Name</span><span>Due Date</span><span>Assigned To</span><span>Approver</span><span>Pre-requisite</span><span>Status</span></div>
            <div class="task-list"></div>
          </div>
        </div>
      </section>
    `;

    const employeeDetail = data.employee_tasks?.[employee.employee_id];
    const taskList = document.querySelector('.task-list');
    if (employeeDetail?.categories?.length) {
      taskList.innerHTML = employeeDetail.categories.flatMap((category) => category.tasks.map((task) => `
        <div class="task-row"><span>${task.task_name}</span><span>${task.deadline || 'N/A'}</span><span>${task.assigned_to}</span><span>${task.needs_approval ? 'Required' : 'None'}</span><span>-</span><span>${task.status.replace('_', ' ')}</span></div>
      `)).join('');
    } else {
      taskList.innerHTML = '<div class="task-empty"><strong>No tasks yet</strong><span>Tasks will appear here once they are assigned.</span></div>';
    }

    document.querySelector('.detail-close').addEventListener('click', () => {
      const contentContainer = document.getElementById('tab-content-container');
      fetch('pages/onboarding/per_employee.html')
        .then((response) => response.text())
        .then((html) => {
          const documentFragment = new DOMParser().parseFromString(html, 'text/html');
          contentContainer.innerHTML = documentFragment.body.innerHTML;
          return window.initPerEmployee();
        })
        .catch((error) => {
          contentContainer.innerHTML = '<p>Failed to restore employee list.</p>';
          console.error('Failed to restore employee list:', error);
        });
    });

    document.querySelector('.add-task-btn').addEventListener('click', () => {
      const drawer = document.createElement('div');
      drawer.className = 'task-drawer-layer';
      drawer.innerHTML = `
        <div class="task-drawer-overlay"></div>
        <aside class="task-drawer" aria-label="Add Custom Task">
          <div class="task-drawer-content">
            <h2>Add Custom Task</h2>
            <div class="task-notice">ⓘ&nbsp; Tasks added on this page will not be included in the active templates. To add new tasks to the template, please configure them <a href="#">here</a>.</div>
            <label>Task Name<input type="text" placeholder="Name"></label>
            <label>Task Type<select><option>Task type</option></select></label>
            <label>Category<select><option>Category</option></select></label>
            <label>Start<select><option>Start</option></select></label>
            <label>Deadline<select><option>Deadline</option></select></label>
            <label>Assigned To<select><option>Assigned to</option></select></label>
          </div>
          <div class="task-drawer-footer"><button class="drawer-cancel" type="button">Cancel</button><button class="drawer-submit" type="button">Submit</button></div>
        </aside>
      `;
      document.body.appendChild(drawer);

      const closeDrawer = () => drawer.remove();
      drawer.querySelector('.task-drawer-overlay').addEventListener('click', closeDrawer);
      drawer.querySelector('.drawer-cancel').addEventListener('click', closeDrawer);
      drawer.querySelector('.drawer-submit').addEventListener('click', closeDrawer);
    });
  };

  renderTable(employees);

  document.getElementById('search-input').addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    renderTable(employees.filter((employee) =>
      employee.employee_name.toLowerCase().includes(query) ||
      employee.employee_code.toLowerCase().includes(query) ||
      employee.department.toLowerCase().includes(query)
    ));
  });

  document.querySelectorAll('.summary-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.summary-card').forEach((item) => item.classList.remove('active'));
      card.classList.add('active');

      const filter = card.dataset.filter;
      renderTable(filter === 'all'
        ? employees
        : employees.filter((employee) => employee.status === filter));
    });
  });
};

window.initPerTemplate = async function initPerTemplate() {
  const response = await fetch(`data/onboarding.json?v=${Date.now()}`);
  if (!response.ok) throw new Error(`Failed to load onboarding data: ${response.status}`);

  const data = await response.json();
  const templates = data.templates || [];
  const tbody = document.getElementById('template-table-body');
  const empty = document.getElementById('template-empty');
  const total = document.getElementById('template-total');

  const renderTemplates = (items) => {
    tbody.innerHTML = items.map((template) => `
      <tr>
        <td><strong class="template-name">${template.template_name}</strong></td>
        <td>${template.active_employee_count} employee</td>
        <td>${template.stages_count} stage${template.stages_count === 1 ? '' : 's'}</td>
        <td>${template.approval_workflow} <span class="approval-info">i</span></td>
        <td>${new Date(template.created_at).toLocaleDateString('en-GB')}</td>
        <td><div class="action-cell"><button class="action-btn" title="Edit Template" aria-label="Edit Template">✎</button><button class="action-btn" title="Delete Template" aria-label="Delete Template">⌫</button></div></td>
      </tr>
    `).join('');
    empty.hidden = items.length > 0;
    tbody.closest('table').hidden = items.length === 0;
  };

  total.textContent = templates.length;
  renderTemplates(templates);
  document.querySelector('.template-search').addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    renderTemplates(templates.filter((template) => template.template_name.toLowerCase().includes(query)));
  });
};

window.initApprovalRequired = async function initApprovalRequired() {
  const response = await fetch(`data/onboarding.json?v=${Date.now()}`);
  if (!response.ok) throw new Error(`Failed to load onboarding data: ${response.status}`);

  const data = await response.json();
  const approvals = data.approvals?.data || [];
  const tbody = document.getElementById('approval-table-body');
  const empty = document.getElementById('approval-empty');
  const count = document.getElementById('approval-count') || document.querySelector('.tab-btn[data-tab="approval_required"] .tab-badge');
  if (count) count.textContent = approvals.length;

  const renderApprovals = (items) => {
    tbody.innerHTML = items.map((approval) => `
      <tr>
        <td><strong class="template-name">${approval.employee_name}</strong></td>
        <td>${approval.first_working_day}</td>
        <td>${approval.task_name}</td>
        <td>${approval.task_type}</td>
        <td>${approval.deadline}</td>
        <td><span class="approval-status">Pending</span></td>
        <td><button class="action-btn" title="Review Approval" aria-label="Review Approval">→</button></td>
      </tr>
    `).join('');
    empty.hidden = items.length > 0;
    tbody.closest('table').hidden = items.length === 0;
  };

  renderApprovals(approvals);
  document.querySelector('.approval-search').addEventListener('input', (event) => {
    const query = event.target.value.toLowerCase();
    renderApprovals(approvals.filter((approval) =>
      approval.employee_name.toLowerCase().includes(query) || approval.task_name.toLowerCase().includes(query)
    ));
  });
};

window.initEmployeeList = async function initEmployeeList() {
  const response = await fetch(`data/employees.json?v=${Date.now()}`);
  if (!response.ok) throw new Error(`Failed to load employee data: ${response.status}`);

  const data = await response.json();
  let activeTab = 'active';
  const employees = data.employees || [];
  const tbody = document.getElementById('employee-table-body');
  const empty = document.getElementById('empty-state');

  const filterByTab = () => employees.filter((employee) => employee.tab === activeTab);
  const badgeClass = (type) => ({
    Permanent: 'badge-permanent',
    Contract: 'badge-contract',
    Intern: 'badge-intern',
    Probation: 'badge-probation'
  }[type] || 'badge-permanent');

  const renderTable = (items) => {
    empty.style.display = items.length ? 'none' : 'flex';
    tbody.innerHTML = items.map((employee) => `
      <tr>
        <td><div class="employee-cell"><div class="avatar">${employee.initials}</div><div><div class="employee-name">${employee.name}</div><div class="employee-meta">${employee.id}</div></div></div></td>
        <td><span class="badge ${badgeClass(employee.employmentType)}">${employee.employmentType}</span></td>
        <td>${employee.company}</td>
        <td>${employee.department}</td>
        <td>${employee.position}</td>
        <td>${employee.joinDate}</td>
        <td><button class="row-action-btn" type="button">Action <span>⌄</span></button></td>
      </tr>
    `).join('');
  };

  const renderCurrentTable = () => {
    const query = document.getElementById('search-input').value.toLowerCase();
    renderTable(filterByTab().filter((employee) =>
      employee.name.toLowerCase().includes(query) ||
      employee.id.toLowerCase().includes(query) ||
      employee.position.toLowerCase().includes(query)
    ));
  };

  const banner = document.getElementById('notification-banner');
  banner.innerHTML = (data.notifications || []).map((notification) => `
    <div class="notification-item"><span class="notification-icon">!</span><span><strong>${notification.count} ${notification.bold}</strong> ${notification.message} <a href="#">${notification.action}</a></span></div>
  `).join('');
  banner.style.display = data.notifications?.length ? 'flex' : 'none';

  document.querySelectorAll('.tab-group .tab-btn').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-group .tab-btn').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      activeTab = button.dataset.tab;
      renderCurrentTable();
    });
  });

  document.getElementById('search-input').addEventListener('input', renderCurrentTable);
  renderCurrentTable();
};

window.initOnboardingCreate = function initOnboardingCreate() {
  const form = document.getElementById('onboarding-create-form');
  if (!form) return;

  let currentStep = 1;
  const panels = form.querySelectorAll('.create-step-panel');
  const steps = document.querySelectorAll('.create-step');
  const backButton = document.getElementById('create-back');
  const nextButton = document.getElementById('create-next');
  const reminderList = document.getElementById('reminder-list');

  const updateWizard = () => {
    panels.forEach((panel) => {
      panel.hidden = Number(panel.dataset.panel) !== currentStep;
    });

    steps.forEach((step) => {
      step.classList.toggle('active', Number(step.dataset.step) === currentStep);
      step.classList.toggle('complete', Number(step.dataset.step) < currentStep);
    });

    backButton.hidden = currentStep === 1;
    nextButton.textContent = currentStep === 3 ? 'Save' : 'Next';
  };

  const addReminder = () => {
    if (reminderList.children.length >= 3) return;
    const reminder = document.createElement('div');
    reminder.className = 'reminder-item';
    reminder.innerHTML = '<input type="number" min="1" value="1"><span>days</span><label><input type="radio" name="reminderType" checked> Before deadline</label><label><input type="radio" name="reminderType"> After invite</label><button type="button" aria-label="Remove reminder">×</button>';
    reminder.querySelector('button').addEventListener('click', () => reminder.remove());
    reminderList.appendChild(reminder);
  };

  document.querySelector('.add-template-btn')?.addEventListener('click', () => {
    window.location.hash = 'onboarding/create';
  });

  document.getElementById('add-reminder').addEventListener('click', addReminder);
  document.querySelector('.add-task-row').addEventListener('click', () => {
    const taskRow = document.querySelector('.task-row').cloneNode(true);
    taskRow.querySelectorAll('input').forEach((input) => { input.value = ''; });
    taskRow.querySelectorAll('select').forEach((select) => { select.selectedIndex = 0; });
    document.querySelector('.create-task-table').appendChild(taskRow);
  });
  document.querySelector('.add-category-btn').addEventListener('click', () => {
    const category = document.querySelector('.category-item').cloneNode(true);
    category.classList.remove('active');
    category.querySelector('strong').textContent = `${document.querySelectorAll('.category-item').length + 1}  Category ${document.querySelectorAll('.category-item').length + 1}`;
    document.querySelector('.category-list').insertBefore(category, document.querySelector('.add-category-btn'));
  });
  document.querySelector('.outline-create-btn').addEventListener('click', () => {
    document.querySelector('.criteria-empty').outerHTML = `
      <div class="criteria-editor">
        <div class="criteria-editor-header">
          <label>Category Name<input type="text" value="Category 1"></label>
        </div>
        <div class="criteria-columns">
          <div class="criteria-column">
            <strong>Employment Status</strong>
            <small>Minimum select 1</small>
            <input type="search" placeholder="Search Employment...">
            <label><input type="checkbox"> All Employment Status</label>
            <label><input type="checkbox"> Permanent</label>
            <label><input type="checkbox"> Contract</label>
            <label><input type="checkbox"> Probation</label>
            <label><input type="checkbox"> Intern</label>
            <label><input type="checkbox"> Freelance</label>
          </div>
          <div class="criteria-column">
            <strong>Branch</strong>
            <small>Minimum select 1</small>
            <input type="search" placeholder="Search Branch">
            <label><input type="checkbox"> All Branch</label>
            <label><input type="checkbox"> Finance</label>
            <label><input type="checkbox"> Headquarter</label>
          </div>
          <div class="criteria-column">
            <strong>Department</strong>
            <small>Minimum select 1</small>
            <input type="search" placeholder="Search Department">
            <label><input type="checkbox"> All Department</label>
            <label><input type="checkbox"> Human Resources</label>
          </div>
          <div class="criteria-column">
            <strong>Position</strong>
            <small>Minimum select 1</small>
            <input type="search" placeholder="Search Position">
            <label><input type="checkbox"> All Position</label>
            <label><input type="checkbox"> Test Auto 1</label>
            <label><input type="checkbox"> Test Auto 2</label>
            <label><input type="checkbox"> Test Position XYZ</label>
          </div>
        </div>
        <div class="criteria-task-heading"><strong>Tasks</strong><button class="secondary-create-btn criteria-add-task" type="button">+&nbsp; Add Task</button></div>
        <div class="create-task-table criteria-task-table">
          <div class="task-table-head"><span>Type</span><span>Task Name</span><span>Start</span><span>Deadline</span><span>Assigned To</span></div>
          <div class="task-row"><select class="task-type"><option>Mark as done</option><option>Image</option><option>File</option><option>Text</option></select><input placeholder="Task name"><select><option>Select start</option><option>Anytime</option><option>On first working day</option><option>First working day + N</option></select><select><option>Deadline</option><option>No deadline</option></select><select><option>Assigned to</option><option>Employee</option></select></div>
        </div>
      </div>
    `;

    document.querySelector('.criteria-add-task').addEventListener('click', () => {
      const taskRow = document.querySelector('.criteria-task-table .task-row').cloneNode(true);
      taskRow.querySelectorAll('input').forEach((input) => { input.value = ''; });
      taskRow.querySelectorAll('select').forEach((select) => { select.selectedIndex = 0; });
      document.querySelector('.criteria-task-table').appendChild(taskRow);
    });
  });
  document.getElementById('create-cancel').addEventListener('click', () => {
    window.location.hash = 'onboarding?tab=per_template';
  });
  backButton.addEventListener('click', () => {
    currentStep = Math.max(1, currentStep - 1);
    updateWizard();
  });
  nextButton.addEventListener('click', () => {
    if (currentStep === 1 && !document.getElementById('template-name').value.trim()) {
      document.querySelector('.field-error').hidden = false;
      document.getElementById('template-name').classList.add('invalid');
      return;
    }

    if (currentStep < 3) {
      currentStep += 1;
      updateWizard();
    } else {
      window.location.hash = 'onboarding?tab=per_template';
    }
  });
  document.getElementById('template-name').addEventListener('input', () => {
    document.querySelector('.field-error').hidden = true;
    document.getElementById('template-name').classList.remove('invalid');
  });

  updateWizard();
};
