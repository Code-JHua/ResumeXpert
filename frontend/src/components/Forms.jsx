"use client";

import { Input } from "./Inputs";
import { RatingInput } from "./ResumeSection";
import { Plus, Trash2 } from "lucide-react";
import {
  commonStyles,
  additionalInfoStyles,
  certificationInfoStyles,
  contactInfoStyles,
  educationDetailsStyles,
  profileInfoStyles,
  projectDetailStyles,
  skillsInfoStyles,
  workExperienceStyles
} from "../assets/dummystyle";
import { useTranslation } from 'react-i18next';

// Get translation hook outside components
let t;
const setT = (tFn) => { t = tFn; };

// AdditionalInfoForm Component
export const AdditionalInfoForm = ({ languages, interests, updateArrayItem, addArrayItem, removeArrayItem }) => {
  const { t } = useTranslation();
  return (
    <div className={additionalInfoStyles.container}>
      <h2 className={additionalInfoStyles.heading}>{t('forms.additional.title')}</h2>

      {/* Languages Section */}
      <div className="mb-10">
        <h3 className={additionalInfoStyles.sectionHeading}>
          <div className={additionalInfoStyles.dotViolet}></div>
          {t('forms.additional.languages')}
        </h3>
        <div className="space-y-6">
          {languages?.map((lang, index) => (
            <div key={index} className={additionalInfoStyles.languageItem}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <Input
                  label={t('forms.additional.language')}
                  placeholder={t('forms.additional.languagePlaceholder')}
                  value={lang.name || ""}
                  onChange={({ target }) => updateArrayItem("languages", index, "name", target.value)}
                />
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-4">{t('forms.additional.proficiency')}</label>
                  <RatingInput
                    value={lang.progress || 0}
                    total={5}
                    color="#8b5cf6"
                    bgColor="#e2e8f0"
                    onChange={(value) => updateArrayItem("languages", index, "progress", value)}
                  />
                </div>
              </div>
              {languages.length > 1 && (
                <button
                  type="button"
                  className={commonStyles.trashButton}
                  onClick={() => removeArrayItem("languages", index)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className={`${commonStyles.addButtonBase} ${additionalInfoStyles.addButtonLanguage}`}
            onClick={() => addArrayItem("languages", { name: "", progress: 0 })}
          >
            <Plus size={16} /> {t('forms.additional.addLanguage')}
          </button>
        </div>
      </div>

      {/* Interests Section */}
      <div className="mb-6">
        <h3 className={additionalInfoStyles.sectionHeading}>
          <div className={additionalInfoStyles.dotOrange}></div>
          {t('forms.additional.interests')}
        </h3>
        <div className="space-y-4">
          {interests?.map((interest, index) => (
            <div key={index} className={additionalInfoStyles.interestItem}>
              <Input
                placeholder={t('forms.additional.interestPlaceholder')}
                value={interest || ""}
                onChange={({ target }) => updateArrayItem("interests", index, null, target.value)}
              />
              {interests.length > 1 && (
                <button
                  type="button"
                  className={commonStyles.trashButton}
                  onClick={() => removeArrayItem("interests", index)}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className={`${commonStyles.addButtonBase} ${additionalInfoStyles.addButtonInterest}`}
            onClick={() => addArrayItem("interests", "")}
          >
            <Plus size={16} /> {t('forms.additional.addInterest')}
          </button>
        </div>
      </div>
    </div>
  );
};

// CertificationInfoForm Component
export const CertificationInfoForm = ({ certifications, updateArrayItem, addArrayItem, removeArrayItem }) => {
  const { t } = useTranslation();
  return (
    <div className={certificationInfoStyles.container}>
      <h2 className={certificationInfoStyles.heading}>{t('forms.certifications.title')}</h2>
      <div className="space-y-6 mb-6">
        {certifications.map((cert, index) => (
          <div key={index} className={certificationInfoStyles.item}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('forms.certifications.certificateTitle')}
                placeholder={t('forms.certifications.certificateTitlePlaceholder')}
                value={cert.title || ""}
                onChange={({ target }) => updateArrayItem(index, "title", target.value)}
              />

              <Input
                label={t('forms.certifications.issuer')}
                placeholder={t('forms.certifications.issuerPlaceholder')}
                value={cert.issuer || ""}
                onChange={({ target }) => updateArrayItem(index, "issuer", target.value)}
              />

              <Input
                label={t('forms.certifications.year')}
                placeholder={t('forms.certifications.yearPlaceholder')}
                value={cert.year || ""}
                onChange={({ target }) => updateArrayItem(index, "year", target.value)}
              />
            </div>

            {certifications.length > 1 && (
              <button
                type="button"
                className={commonStyles.trashButton}
                onClick={() => removeArrayItem(index)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className={`${commonStyles.addButtonBase} ${certificationInfoStyles.addButton}`}
          onClick={() =>
            addArrayItem({
              title: "",
              issuer: "",
              year: "",
            })
          }
        >
          <Plus size={16} />
          {t('forms.certifications.add')}
        </button>
      </div>
    </div>
  );
};

// ContactInfoForm Component
export const ContactInfoForm = ({ contactInfo, updateSection }) => {
  const { t } = useTranslation();
  return (
    <div className={contactInfoStyles.container}>
      <h2 className={contactInfoStyles.heading}>{t('forms.contact.title')}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label={t('forms.contact.address')}
            placeholder={t('forms.contact.addressPlaceholder')}
            value={contactInfo.location || ""}
            onChange={({ target }) => updateSection("location", target.value)}
          />
        </div>

        <Input
          label={t('forms.contact.email')}
          placeholder={t('forms.contact.emailPlaceholder')}
          type="email"
          value={contactInfo.email || ""}
          onChange={({ target }) => updateSection("email", target.value)}
        />

        <Input
          label={t('forms.contact.phone')}
          placeholder={t('forms.contact.phonePlaceholder')}
          value={contactInfo.phone || ""}
          onChange={({ target }) => updateSection("phone", target.value)}
        />

        <Input
          label={t('forms.contact.linkedin')}
          placeholder={t('forms.contact.linkedinPlaceholder')}
          value={contactInfo.linkedin || ""}
          onChange={({ target }) => updateSection("linkedin", target.value)}
        />

        <Input
          label={t('forms.contact.github')}
          placeholder={t('forms.contact.githubPlaceholder')}
          value={contactInfo.github || ""}
          onChange={({ target }) => updateSection("github", target.value)}
        />

        <div className="md:col-span-2">
          <Input
            label={t('forms.contact.website')}
            placeholder={t('forms.contact.websitePlaceholder')}
            value={contactInfo.website || ""}
            onChange={({ target }) => updateSection("website", target.value)}
          />
        </div>
      </div>
    </div>
  );
};

// EducationDetailsForm Component
export const EducationDetailsForm = ({ educationInfo, updateArrayItem, addArrayItem, removeArrayItem }) => {
  const { t } = useTranslation();
  return (
    <div className={educationDetailsStyles.container}>
      <h2 className={educationDetailsStyles.heading}>{t('forms.education.title')}</h2>
      <div className="space-y-6 mb-6">
        {educationInfo.map((education, index) => (
          <div key={index} className={educationDetailsStyles.item}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('forms.education.degree')}
                placeholder={t('forms.education.degreePlaceholder')}
                value={education.degree || ""}
                onChange={({ target }) => updateArrayItem(index, "degree", target.value)}
              />

              <Input
                label={t('forms.education.institution')}
                placeholder={t('forms.education.institutionPlaceholder')}
                value={education.institution || ""}
                onChange={({ target }) => updateArrayItem(index, "institution", target.value)}
              />

              <Input
                label={t('forms.education.startDate')}
                type="month"
                value={education.startDate || ""}
                onChange={({ target }) => updateArrayItem(index, "startDate", target.value)}
              />

              <Input
                label={t('forms.education.endDate')}
                type="month"
                value={education.endDate || ""}
                onChange={({ target }) => updateArrayItem(index, "endDate", target.value)}
              />
            </div>
            {educationInfo.length > 1 && (
              <button
                type="button"
                className={commonStyles.trashButton}
                onClick={() => removeArrayItem(index)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className={`${commonStyles.addButtonBase} ${educationDetailsStyles.addButton}`}
          onClick={() =>
            addArrayItem({
              degree: "",
              institution: "",
              startDate: "",
              endDate: "",
            })
          }
        >
          <Plus size={16} /> {t('forms.education.add')}
        </button>
      </div>
    </div>
  );
};

// ProfileInfoForm Component
export const ProfileInfoForm = ({ profileData, updateSection }) => {
  const { t } = useTranslation();
  return (
    <div className={profileInfoStyles.container}>
      <h2 className={profileInfoStyles.heading}>{t('forms.profile.title')}</h2>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label={t('forms.profile.fullName')}
            placeholder={t('forms.profile.fullNamePlaceholder')}
            value={profileData.fullName || ""}
            onChange={({ target }) => updateSection("fullName", target.value)}
          />

          <Input
            label={t('forms.profile.designation')}
            placeholder={t('forms.profile.designationPlaceholder')}
            value={profileData.designation || ""}
            onChange={({ target }) => updateSection("designation", target.value)}
          />

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-3">{t('forms.profile.summary')}</label>
            <textarea
              className={profileInfoStyles.textarea}
              rows={4}
              placeholder={t('forms.profile.summaryPlaceholder')}
              value={profileData.summary || ""}
              onChange={({ target }) => updateSection("summary", target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ProjectDetailForm Component
export const ProjectDetailForm = ({ projectInfo, updateArrayItem, addArrayItem, removeArrayItem }) => {
  const { t } = useTranslation();
  return (
    <div className={projectDetailStyles.container}>
      <h2 className={projectDetailStyles.heading}>{t('forms.projects.title')}</h2>
      <div className="space-y-6 mb-6">
        {projectInfo.map((project, index) => (
          <div key={index} className={projectDetailStyles.item}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label={t('forms.projects.projectTitle')}
                  placeholder={t('forms.projects.projectTitlePlaceholder')}
                  value={project.title || ""}
                  onChange={({ target }) => updateArrayItem(index, "title", target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-3">{t('forms.projects.description')}</label>
                <textarea
                  placeholder={t('forms.projects.descriptionPlaceholder')}
                  className={projectDetailStyles.textarea}
                  rows={3}
                  value={project.description || ""}
                  onChange={({ target }) => updateArrayItem(index, "description", target.value)}
                />
              </div>

              <Input
                label={t('forms.projects.githubLink')}
                placeholder={t('forms.projects.githubLinkPlaceholder')}
                value={project.github || ""}
                onChange={({ target }) => updateArrayItem(index, "github", target.value)}
              />

              <Input
                label={t('forms.projects.liveDemoUrl')}
                placeholder={t('forms.projects.liveDemoUrlPlaceholder')}
                value={project.liveDemo || ""}
                onChange={({ target }) => updateArrayItem(index, "liveDemo", target.value)}
              />
            </div>

            {projectInfo.length > 1 && (
              <button
                type="button"
                className={commonStyles.trashButton}
                onClick={() => removeArrayItem(index)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className={`${commonStyles.addButtonBase} ${projectDetailStyles.addButton}`}
          onClick={() =>
            addArrayItem({
              title: "",
              description: "",
              github: "",
              liveDemo: "",
            })
          }
        >
          <Plus size={16} />
          {t('forms.projects.add')}
        </button>
      </div>
    </div>
  );
};

// SkillsInfoForm Component
export const SkillsInfoForm = ({ skillsInfo, updateArrayItem, addArrayItem, removeArrayItem }) => {
  const { t } = useTranslation();
  return (
    <div className={skillsInfoStyles.container}>
      <h2 className={skillsInfoStyles.heading}>{t('forms.skills.title')}</h2>
      <div className="space-y-6 mb-6">
        {skillsInfo.map((skill, index) => (
          <div key={index} className={skillsInfoStyles.item}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('forms.skills.skillName')}
                placeholder={t('forms.skills.skillNamePlaceholder')}
                value={skill.name || ""}
                onChange={({ target }) => updateArrayItem(index, "name", target.value)}
              />

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  {t('forms.skills.proficiency')} ({skill.progress ? Math.round(skill.progress / 20) : 0}/5)
                </label>
                <div className="mt-2">
                  <RatingInput
                    value={skill.progress || 0}
                    total={5}
                    color="#f59e0b"
                    bgColor="#e2e8f0"
                    onChange={(newValue) => updateArrayItem(index, "progress", newValue)}
                  />
                </div>
              </div>
            </div>

            {skillsInfo.length > 1 && (
              <button
                type="button"
                className={commonStyles.trashButton}
                onClick={() => removeArrayItem(index)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className={`${commonStyles.addButtonBase} ${skillsInfoStyles.addButton}`}
          onClick={() =>
            addArrayItem({
              name: "",
              progress: 0,
            })
          }
        >
          <Plus size={16} /> {t('forms.skills.add')}
        </button>
      </div>
    </div>
  );
};

// WorkExperienceForm Component
export const WorkExperienceForm = ({ workExperience, updateArrayItem, addArrayItem, removeArrayItem }) => {
  const { t } = useTranslation();
  return (
    <div className={workExperienceStyles.container}>
      <h2 className={workExperienceStyles.heading}>{t('forms.workExperience.title')}</h2>
      <div className="space-y-6 mb-6">
        {workExperience.map((experience, index) => (
          <div key={index} className={workExperienceStyles.item}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label={t('forms.workExperience.company')}
                placeholder={t('forms.workExperience.companyPlaceholder')}
                value={experience.company || ""}
                onChange={({ target }) => updateArrayItem(index, "company", target.value)}
              />

              <Input
                label={t('forms.workExperience.role')}
                placeholder={t('forms.workExperience.rolePlaceholder')}
                value={experience.role || ""}
                onChange={({ target }) => updateArrayItem(index, "role", target.value)}
              />

              <Input
                label={t('forms.workExperience.startDate')}
                type="month"
                value={experience.startDate || ""}
                onChange={({ target }) => updateArrayItem(index, "startDate", target.value)}
              />

              <Input
                label={t('forms.workExperience.endDate')}
                type="month"
                value={experience.endDate || ""}
                onChange={({ target }) => updateArrayItem(index, "endDate", target.value)}
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-bold text-slate-700 mb-3">{t('forms.workExperience.description')}</label>
              <textarea
                placeholder={t('forms.workExperience.descriptionPlaceholder')}
                className={workExperienceStyles.textarea}
                rows={3}
                value={experience.description || ""}
                onChange={({ target }) => updateArrayItem(index, "description", target.value)}
              />
            </div>

            {workExperience.length > 1 && (
              <button
                type="button"
                className={commonStyles.trashButton}
                onClick={() => removeArrayItem(index)}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className={`${commonStyles.addButtonBase} ${workExperienceStyles.addButton}`}
          onClick={() =>
            addArrayItem({
              company: "",
              role: "",
              startDate: "",
              endDate: "",
              description: "",
            })
          }
        >
          <Plus size={16} />
          {t('forms.workExperience.add')}
        </button>
      </div>
    </div>
  );
};