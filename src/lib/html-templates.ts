export const attachedResumeTemplateHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Sarah Johnson - Professional Resume</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Times New Roman', Times, serif;
        line-height: 1.6;
        color: #333333;
        background: white;
        margin: 0;
        padding: 0;
      }

      .resume-container {
        display: flex;
        width: 100%;
        min-height: 100vh;
        background: white;
      }

      .left-column {
        width: 35%;
        background-color: #e8e8e8;
        padding: 40px 30px;
        display: flex;
        flex-direction: column;
        gap: 30px;
      }

      .right-column {
        width: 65%;
        background-color: white;
        position: relative;
      }

      .header-section {
        background-color: #2e8b57;
        padding: 40px 50px;
        color: white;
      }

      .name {
        font-size: 48px;
        font-weight: 700;
        margin-bottom: 10px;
        line-height: 1.1;
      }

      .job-title {
        font-size: 18px;
        font-weight: 400;
      }

      .photo-placeholder {
        width: 150px;
        height: 150px;
        aspect-ratio: 1 / 1;
        flex-shrink: 0;
        position: relative;
        min-width: 150px;
        min-height: 150px;
        border-radius: 50%;
        border: 4px solid #2e8b57;
        background-color: #f0f0f0;
        margin: 0 auto 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #666;
        font-size: 14px;
        overflow: hidden;
      }

      .photo-placeholder img {
        width: 150px;
        height: 150px;
        object-fit: cover;
        object-position: center;
      }

      .section-header {
        color: #2e8b57;
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 15px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .profile-text {
        font-size: 12px;
        line-height: 1.5;
        margin-bottom: 12px;
        text-align: justify;
      }

      .language-item,
      .contact-item {
        font-size: 12px;
        margin-bottom: 8px;
        color: #333333;
      }

      .right-content {
        padding: 40px 50px;
      }

      .right-section {
        margin-bottom: 35px;
      }

      .section-header-right {
        display: flex;
        align-items: center;
        color: #2e8b57;
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 20px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .section-icon {
        width: 12px;
        height: 12px;
        background-color: #2e8b57;
        border-radius: 50%;
        margin-right: 15px;
      }

      .skill-item,
      .education-item {
        font-size: 12px;
        margin-bottom: 8px;
        color: #333333;
        position: relative;
        padding-left: 15px;
      }

      .skill-item::before {
        content: '•';
        color: #2e8b57;
        position: absolute;
        left: 0;
      }

      .education-entry {
        margin-bottom: 20px;
      }

      .education-period {
        font-weight: 500;
        color: #2e8b57;
        font-size: 12px;
      }

      .education-school {
        font-weight: 700;
        color: #2e8b57;
        font-size: 13px;
        margin: 5px 0;
      }

      .education-degree {
        font-size: 12px;
        color: #333333;
      }

      .experience-company {
        font-weight: 700;
        color: #2e8b57;
        font-size: 13px;
        margin-bottom: 8px;
      }

      .experience-description {
        font-size: 12px;
        color: #333333;
        line-height: 1.5;
        text-align: justify;
      }
    </style>
  </head>
  <body>
    <div class="resume-container">
      <div class="left-column">
        <div class="photo-placeholder">
          <img src="https://page1.genspark.site/v1/base64_upload/43d895e20e7aee32af01cc8bfb5316ed" alt="Professional Photo" />
        </div>

        <div class="profile-section">
          <h2 class="section-header">Profile</h2>
          <p class="profile-text">
            Experienced marketing professional with over 8 years of expertise in digital strategy development and brand management.
            Proven track record in developing comprehensive marketing campaigns that drive customer engagement and revenue growth.
          </p>
          <p class="profile-text">
            Specialized in data-driven marketing approaches with strong analytical skills for optimizing campaign performance.
            Passionate about leveraging emerging technologies to create innovative marketing solutions.
          </p>
          <p class="profile-text">
            Seeking opportunities to lead strategic marketing initiatives for a forward-thinking organization while mentoring junior
            team members and driving organizational growth.
          </p>
        </div>

        <div class="language-section">
          <h2 class="section-header">Language</h2>
          <div class="language-item">English (Native)</div>
          <div class="language-item">French (Intermediate)</div>
          <div class="language-item">Spanish (Conversational)</div>
        </div>

        <div class="contact-section">
          <h2 class="section-header">Contact Me</h2>
          <div class="contact-item">(555) 123-4567</div>
          <div class="contact-item">sarah.johnson@example.com</div>
          <div class="contact-item">456 Business Ave<br />New York, NY</div>
        </div>
      </div>

      <div class="right-column">
        <div class="header-section">
          <h1 class="name">James Johnson</h1>
          <div class="job-title">Senior Marketing Manager</div>
        </div>

        <div class="right-content">
          <div class="right-section">
            <h2 class="section-header-right">
              <div class="section-icon"></div>
              Skills
            </h2>
            <div class="skill-item">Digital Marketing Strategy</div>
            <div class="skill-item">Data Analysis &amp; Reporting</div>
            <div class="skill-item">Brand Management</div>
            <div class="skill-item">Campaign Development &amp; Execution</div>
            <div class="skill-item">Social Media Marketing</div>
          </div>

          <div class="right-section">
            <h2 class="section-header-right">
              <div class="section-icon"></div>
              Education
            </h2>
            <div class="education-entry">
              <div class="education-period">2016-2020</div>
              <div class="education-school">Columbia University</div>
              <div class="education-degree">Master of Business Administration, completed</div>
            </div>
            <div class="education-entry">
              <div class="education-period">2012-2016</div>
              <div class="education-school">Boston University</div>
              <div class="education-degree">Bachelor of Marketing, completed</div>
            </div>
          </div>

          <div class="right-section">
            <h2 class="section-header-right">
              <div class="section-icon"></div>
              Professional Experience
            </h2>
            <div class="experience-company">Digital Innovations Agency</div>
            <div class="experience-description">
              Led comprehensive marketing campaigns for Fortune 500 clients, resulting in a 40% increase in brand engagement across
              digital platforms. Managed cross-functional teams and coordinated with stakeholders to deliver strategic marketing
              solutions that exceeded client expectations and drove measurable business growth.
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;

export function sanitizeImportedHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\sdata-cfemail="[^"]*"/gi, "")
    .replace(/\sclass="__cf_email__"/gi, "")
    .trim();
}

export function isStandaloneHtmlDocument(html: string) {
  return /<html[\s>]/i.test(html) || /<!doctype\s+html/i.test(html);
}
