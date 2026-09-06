const state = {
  me: null,
  data: null
};


/* ==================================
   DEFAULT CONTENT
================================== */

const DEFAULT_DATA = {

  hero: {
    title: "Training that sees the person behind every case.",
    text: "The Aegis Institute supports Discord communities and individuals through personalised consulting and structured education — built around your rules, your people, and your goals.",
    cardTitle: "Two branches. One standard of care.",
    cardText: "Consulting for communities that want clarity — education for staff and aspiring moderators who want to know where to start."
  },

  services: [
    {
      label: "SERVER OWNERS",
      title: "Outsourced staff training",
      description: "High-quality training, assessments and feedback aligned to your rules and procedures.",
      bullets: [
        "Training, assessments & educator support",
        "Structured standards",
        "Actionable feedback"
      ]
    },
    {
      label: "PLAYERS",
      title: "Moderator & Advanced Fundamentals",
      description: "Preparation for aspiring moderators and supervisors who want to build practical skills.",
      bullets: [
        "Moderator fundamentals",
        "Advanced fundamentals",
        "Practical scenarios"
      ]
    }
  ],

  work: [
    {
      label: "STAFF DEVELOPMENT",
      title: "Structured staff programmes",
      description: "Clear pathways for trainees, moderators, supervisors and leadership teams."
    },
    {
      label: "STANDARDS",
      title: "Policies that people can actually use",
      description: "Practical policies, procedures and expectations written around the way your community operates."
    },
    {
      label: "CONSULTING",
      title: "An external perspective",
      description: "Honest feedback on systems, staff structures, training and community operations."
    },
    {
      label: "EDUCATION",
      title: "Training built around scenarios",
      description: "Learn through examples and situations that staff can actually encounter."
    }
  ],

  contact: {
    title: "Let's talk about what your community needs.",
    text: "Have a question, project idea, or training requirement? Send a message and the Aegis team can help."
  }
};


/* ==================================
   API
================================== */

async function api(url, options = {}) {

  const response = await fetch(url, {
    credentials: "include",

    ...options,

    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let data = {};

  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(
      data.error || "Request failed."
    );
  }

  return data;
}


/* ==================================
   LOAD
================================== */

async function loadPortal() {

  try {
    state.me = await api("/api/auth/me");
  } catch {
    state.me = {
      authenticated: false,
      authorized: false
    };
  }


  try {

    state.data = await api("/api/content");

  } catch {

    state.data = DEFAULT_DATA;

  }


  updateAuthUI();

  renderPage();

  if (
    document.body.classList.contains("admin-page")
  ) {

    setupAdmin();

  }

}


/* ==================================
   AUTH UI
================================== */

function updateAuthUI() {

  const adminUser =
    document.getElementById("adminUser");

  if (!adminUser) return;

  if (state.me?.authenticated) {

    adminUser.textContent =
      state.me.username || "Discord User";

  }

}


/* ==================================
   RENDER
================================== */

function renderPage() {

  const data =
    state.data || DEFAULT_DATA;


  const heroTitle =
    document.getElementById("heroTitle");

  if (heroTitle)
    heroTitle.textContent =
      data.hero.title;


  const heroText =
    document.getElementById("heroText");

  if (heroText)
    heroText.textContent =
      data.hero.text;


  const cardTitle =
    document.getElementById("heroCardTitle");

  if (cardTitle)
    cardTitle.textContent =
      data.hero.cardTitle;


  const cardText =
    document.getElementById("heroCardText");

  if (cardText)
    cardText.textContent =
      data.hero.cardText;


  const contactTitle =
    document.getElementById("contactTitle");

  if (contactTitle)
    contactTitle.textContent =
      data.contact.title;


  const contactText =
    document.getElementById("contactText");

  if (contactText)
    contactText.textContent =
      data.contact.text;

}


/* ==================================
   ADMIN
================================== */

async function setupAdmin() {

  const editor =
    document.getElementById("editor");

  const denied =
    document.getElementById("accessDenied");


  if (!state.me?.authorized) {

    denied?.classList.remove("hidden");

    return;

  }


  editor?.classList.remove("hidden");


  setupTabs();

  fillHomepageEditor();

  fillServicesEditor();

  fillWorkEditor();

  fillContactEditor();

  setupAdminButtons();

}


/* ==================================
   TABS
================================== */

function setupTabs() {

  document.querySelectorAll(
    ".editor-tab"
  ).forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document.querySelectorAll(
          ".editor-tab"
        ).forEach(x =>
          x.classList.remove("active")
        );

        document.querySelectorAll(
          ".editor-panel"
        ).forEach(x =>
          x.classList.remove("active")
        );


        button.classList.add("active");


        const target =
          document.getElementById(
            "tab-" + button.dataset.tab
          );

        target?.classList.add("active");

      }
    );

  });

}


/* ==================================
   HOMEPAGE EDITOR
================================== */

function fillHomepageEditor() {

  document.getElementById(
    "editHeroTitle"
  ).value =
    state.data.hero.title;


  document.getElementById(
    "editHeroText"
  ).value =
    state.data.hero.text;


  document.getElementById(
    "editHeroCardTitle"
  ).value =
    state.data.hero.cardTitle;


  document.getElementById(
    "editHeroCardText"
  ).value =
    state.data.hero.cardText;

}


/* ==================================
   SERVICES EDITOR
================================== */

function fillServicesEditor() {

  const wrapper =
    document.getElementById(
      "servicesEditor"
    );

  if (!wrapper) return;


  wrapper.innerHTML = "";


  state.data.services.forEach(
    (service, index) => {

      const item =
        document.createElement("div");

      item.className =
        "editor-item";


      item.innerHTML = `

        <button
          class="delete-item"
          type="button"
        >
          Delete
        </button>

        <label>
          Label

          <input
            data-field="label"
            value="${escapeAttr(service.label)}"
          >
        </label>

        <label>
          Title

          <input
            data-field="title"
            value="${escapeAttr(service.title)}"
          >
        </label>

        <label>
          Description

          <textarea
            data-field="description"
          >${escapeHTML(service.description)}</textarea>
        </label>

        <label>
          Bullet points
          <small>One item per line</small>

          <textarea
            data-field="bullets"
          >${escapeHTML(
            (service.bullets || []).join("\n")
          )}</textarea>

        </label>

      `;


      item
        .querySelector(".delete-item")
        .addEventListener(
          "click",
          () => {

            state.data.services
              .splice(index, 1);

            fillServicesEditor();

          }
        );


      wrapper.appendChild(item);

    }
  );

}


/* ==================================
   WORK EDITOR
================================== */

function fillWorkEditor() {

  const wrapper =
    document.getElementById(
      "workEditor"
    );

  if (!wrapper) return;


  wrapper.innerHTML = "";


  state.data.work.forEach(
    (work, index) => {

      const item =
        document.createElement("div");

      item.className =
        "editor-item";


      item.innerHTML = `

        <button
          class="delete-item"
          type="button"
        >
          Delete
        </button>

        <label>
          Label

          <input
            data-field="label"
            value="${escapeAttr(work.label)}"
          >
        </label>

        <label>
          Title

          <input
            data-field="title"
            value="${escapeAttr(work.title)}"
          >
        </label>

        <label>
          Description

          <textarea
            data-field="description"
          >${escapeHTML(work.description)}</textarea>
        </label>

      `;


      item
        .querySelector(".delete-item")
        .addEventListener(
          "click",
          () => {

            state.data.work
              .splice(index, 1);

            fillWorkEditor();

          }
        );


      wrapper.appendChild(item);

    }
  );

}


/* ==================================
   CONTACT EDITOR
================================== */

function fillContactEditor() {

  const title =
    document.getElementById(
      "editContactTitle"
    );

  const text =
    document.getElementById(
      "editContactText"
    );


  if (title)
    title.value =
      state.data.contact.title;


  if (text)
    text.value =
      state.data.contact.text;

}


/* ==================================
   ADMIN BUTTONS
================================== */

function setupAdminButtons() {

  document.getElementById(
    "saveHomepage"
  )?.addEventListener(
    "click",
    async () => {

      state.data.hero.title =
        document.getElementById(
          "editHeroTitle"
        ).value;

      state.data.hero.text =
        document.getElementById(
          "editHeroText"
        ).value;

      state.data.hero.cardTitle =
        document.getElementById(
          "editHeroCardTitle"
        ).value;

      state.data.hero.cardText =
        document.getElementById(
          "editHeroCardText"
        ).value;


      await saveContent();

    }
  );


  document.getElementById(
    "saveServices"
  )?.addEventListener(
    "click",
    async () => {

      readServicesEditor();

      await saveContent();

    }
  );


  document.getElementById(
    "saveWork"
  )?.addEventListener(
    "click",
    async () => {

      readWorkEditor();

      await saveContent();

    }
  );


  document.getElementById(
    "saveContact"
  )?.addEventListener(
    "click",
    async () => {

      state.data.contact.title =
        document.getElementById(
          "editContactTitle"
        ).value;

      state.data.contact.text =
        document.getElementById(
          "editContactText"
        ).value;


      await saveContent();

    }
  );


  document.getElementById(
    "addService"
  )?.addEventListener(
    "click",
    () => {

      state.data.services.push({

        label: "NEW SERVICE",

        title: "New Service",

        description:
          "Add a description for this service.",

        bullets: [
          "First item",
          "Second item",
          "Third item"
        ]

      });


      fillServicesEditor();

    }
  );


  document.getElementById(
    "addWork"
  )?.addEventListener(
    "click",
    () => {

      state.data.work.push({

        label: "NEW",

        title: "New Work Item",

        description:
          "Add a description for this work item."

      });


      fillWorkEditor();

    }
  );


  document.getElementById(
    "logoutBtn"
  )?.addEventListener(
    "click",
    async () => {

      await fetch(
        "/api/auth/logout",
        {
          method: "POST"
        }
      );

      window.location.href = "/";

    }
  );

}


/* ==================================
   READ EDITOR
================================== */

function readServicesEditor() {

  const items =
    document.querySelectorAll(
      "#servicesEditor .editor-item"
    );


  state.data.services =
    Array.from(items).map(item => {

      const get =
        field =>
          item.querySelector(
            `[data-field="${field}"]`
          ).value;


      return {

        label: get("label"),

        title: get("title"),

        description:
          get("description"),

        bullets:
          get("bullets")
            .split("\n")
            .map(x => x.trim())
            .filter(Boolean)

      };

    });

}


function readWorkEditor() {

  const items =
    document.querySelectorAll(
      "#workEditor .editor-item"
    );


  state.data.work =
    Array.from(items).map(item => {

      const get =
        field =>
          item.querySelector(
            `[data-field="${field}"]`
          ).value;


      return {

        label: get("label"),

        title: get("title"),

        description:
          get("description")

      };

    });

}


/* ==================================
   SAVE
================================== */

async function saveContent() {

  try {

    await api(
      "/api/content",
      {
        method: "PUT",

        body:
          JSON.stringify(state.data)
      }
    );


    alert(
      "Changes saved successfully."
    );


  } catch (error) {

    alert(
      error.message
    );

  }

}


/* ==================================
   CONTACT FORM
================================== */

function setupContactForm() {

  const form =
    document.getElementById(
      "contactForm"
    );

  if (!form) return;


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const name =
        document.getElementById(
          "contactName"
        ).value.trim();

      const email =
        document.getElementById(
          "contactEmail"
        ).value.trim();

      const message =
        document.getElementById(
          "contactMessage"
        ).value.trim();


      const subject =
        encodeURIComponent(
          "Aegis Institute Enquiry"
        );


      const body =
        encodeURIComponent(
          `Name: ${name}\n\nEmail: ${email}\n\nMessage:\n${message}`
        );


      const status =
        document.getElementById(
          "contactStatus"
        );


      status.textContent =
        "Opening your email application...";


      window.location.href =
        `mailto:?subject=${subject}&body=${body}`;

    }
  );

}


/* ==================================
   HELPERS
================================== */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /[&<>"']/g,
      char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[char])
    );

}


function escapeAttr(value) {

  return escapeHTML(value);

}


/* ==================================
   START
================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadPortal();

    setupContactForm();

  }
);

/* Code-only administrator editor */
(function(){
 const path=location.pathname;
 if(!path.endsWith('/admin.html') && !path.endsWith('admin.html')) return;
 const loginBox=document.getElementById('loginBox'), editorBox=document.getElementById('editorBox');
 const code=document.getElementById('adminCode'), login=document.getElementById('loginBtn'), error=document.getElementById('loginError');
 const area=document.getElementById('contentEditor'), save=document.getElementById('saveBtn'), logout=document.getElementById('logoutBtn'), status=document.getElementById('status');
 async function request(url,opts={}){const r=await fetch(url,{credentials:'include',headers:{'Content-Type':'application/json'},...opts});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||'Request failed');return j}
 async function open(){try{const me=await request('/api/auth/me');if(me.authorized){loginBox.classList.add('hidden');editorBox.classList.remove('hidden');const data=await request('/api/content');area.value=JSON.stringify(data,null,2)}}catch{}}
 login.onclick=async()=>{error.textContent='';try{await request('/api/auth/login',{method:'POST',body:JSON.stringify({code:code.value})});await open()}catch(e){error.textContent=e.message}};
 save.onclick=async()=>{try{const data=JSON.parse(area.value);await request('/api/content',{method:'PUT',body:JSON.stringify(data)});status.textContent='Saved successfully.'}catch(e){status.textContent=e.message}};
 logout.onclick=async()=>{await request('/api/auth/logout',{method:'POST'});location.reload()};open();
})();

(function(){
 const invite='https://discord.gg/U8yH8MWacW';
 document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('a,button').forEach(el=>{if(/sign in with discord|discord login/i.test(el.textContent||'')){el.textContent='Join Discord';el.onclick=()=>location.href=invite;el.removeAttribute('href')}});
  if(!document.querySelector('[data-aegis-theme-toggle]')){const b=document.createElement('button');b.textContent='Light / Dark';b.dataset.aegisThemeToggle='';b.className='ghost';b.onclick=()=>{const dark=document.documentElement.classList.toggle('dark-mode');localStorage.setItem('aegis-theme',dark?'dark':'light')};document.body.prepend(b);if(localStorage.getItem('aegis-theme')==='dark')document.documentElement.classList.add('dark-mode')}
 });
})();
