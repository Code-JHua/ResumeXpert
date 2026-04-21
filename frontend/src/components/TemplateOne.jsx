import React, { useEffect, useRef, useState } from "react";
import { LuMail, LuPhone, LuGithub, LuGlobe } from "react-icons/lu";
import { RiLinkedinLine } from "react-icons/ri";
import { useTranslation } from "react-i18next";
import {
  EducationInfo,
  FreeBlocksSection,
  WorkExperience,
  ProjectInfo,
  CertificationInfo,
} from "./ResumeSection";
import { formatYearMonth } from "../utils/helper";
import { AnimatedText } from "./RenderResume";

const Title = ({ text, color }) => (
  <div className="relative w-fit mb-2 resume-section-title">
    <h2 className="relative text-base font-bold uppercase tracking-wide pb-2" style={{ color }}>
      {text}
    </h2>
    <div className="w-full h-[2px] mt-1" style={{ backgroundColor: color }} />
  </div>
);

const TemplateOne = ({ resumeData = {}, containerWidth, theme = {} }) => {
  const { t } = useTranslation();
  const {
    profileInfo = {},
    contactInfo = {},
    education = [],
    languages = [],
    workExperience = [],
    projects = [],
    skills = [],
    certifications = [],
    interests = [],
    freeBlocks = [],
  } = resumeData;
  const visibleCertifications = certifications.filter(
    (cert) => cert?.title?.trim() || cert?.issuer?.trim() || cert?.year?.trim()
  );

  const resumeRef = useRef(null);
  const [baseWidth, setBaseWidth] = useState(800);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (resumeRef.current && containerWidth > 0) {
      const actualWidth = resumeRef.current.offsetWidth;
      setBaseWidth(actualWidth);
      setScale(containerWidth / actualWidth);
    }
  }, [containerWidth]);

  return (
    <div
      ref={resumeRef}
      className="p-6 bg-white font-sans text-gray-800"
      style={{
        transform: containerWidth > 0 ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        width: containerWidth > 0 ? `${baseWidth}px` : undefined,
        fontFamily: theme.fontFamily,
      }}
    >
      <div className="resume-section flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold pb-2" style={{ color: theme.headingColor }}>
            <AnimatedText>{profileInfo.fullName}</AnimatedText>
          </h1>
          <p className="text-lg font-medium pb-2" style={{ color: theme.accentColor }}>
            <AnimatedText>{profileInfo.designation}</AnimatedText>
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            {contactInfo.email && (
              <div className="flex items-center">
                <LuMail className="mr-1" />
                <a href={`mailto:${contactInfo.email}`} className="hover:underline">
                  <AnimatedText>{contactInfo.email}</AnimatedText>
                </a>
              </div>
            )}
            {contactInfo.phone && (
              <div className="flex items-center">
                <LuPhone className="mr-1" />
                <a href={`tel:${contactInfo.phone}`} className="hover:underline">
                  <AnimatedText>{contactInfo.phone}</AnimatedText>
                </a>
              </div>
            )}
            {contactInfo.location && (
              <div className="flex items-center">
                <span><AnimatedText>{contactInfo.location}</AnimatedText></span>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end text-sm">
          {contactInfo.linkedin && (
            <div className="flex items-center mb-1">
              <RiLinkedinLine className="mr-1" />
              <a href={contactInfo.linkedin} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: theme.accentColor }}>
                <AnimatedText>{t('template.links.linkedin')}</AnimatedText>
              </a>
            </div>
          )}
          {contactInfo.github && (
            <div className="flex items-center mb-1">
              <LuGithub className="mr-1" />
              <a href={contactInfo.github} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: theme.accentColor }}>
                <AnimatedText>{t('template.links.github')}</AnimatedText>
              </a>
            </div>
          )}
          {contactInfo.website && (
            <div className="flex items-center">
              <LuGlobe className="mr-1" />
              <a href={contactInfo.website} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: theme.accentColor }}>
                <AnimatedText>{t('template.links.portfolio')}</AnimatedText>
              </a>
            </div>
          )}
        </div>
      </div>

      {profileInfo.summary && (
        <div className="resume-section mb-3">
          <Title text={t('template.sections.professionalSummary')} color={theme.accentColor} />
          <p className="text-sm leading-relaxed"><AnimatedText>{profileInfo.summary}</AnimatedText></p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 space-y-4">
          {workExperience.length > 0 && (
            <div className="resume-section">
              <Title text={t('template.sections.workExperience')} color={theme.accentColor} />
              <div className="space-y-6">
                {workExperience.map((exp, i) => (
                  <WorkExperience
                    key={i}
                    company={exp.company}
                    role={exp.role}
                    duration={`${formatYearMonth(exp.startDate)} - ${formatYearMonth(exp.endDate)}`}
                    description={exp.description}
                    durationColor={theme.accentColor}
                  />
                ))}
              </div>
            </div>
          )}

          {projects.length > 0 && (
            <div className="resume-section">
              <Title text={t('template.sections.projects')} color={theme.accentColor} />
              <div className="space-y-4">
                {projects.map((proj, i) => (
                  <ProjectInfo
                    key={i}
                    title={proj.title}
                    description={proj.description}
                    githubLink={proj.github}
                    liveDemoUrl={proj.liveDemo}
                    bgColor={theme.tagBackground}
                    headingClass="pb-2"
                  />
                ))}
              </div>
            </div>
          )}

          {freeBlocks.length > 0 && (
            <div className="resume-section">
              <Title text="Additional Information" color={theme.accentColor} />
              <FreeBlocksSection blocks={freeBlocks} itemClassName="mb-4 last:mb-0" />
            </div>
          )}
        </div>

        <div className="col-span-1 space-y-6">
          {skills.length > 0 && (
            <div className="resume-section">
              <Title text={t('template.sections.skills')} color={theme.accentColor} />
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ backgroundColor: theme.tagBackground, color: theme.headingColor }}
                  >
                    <AnimatedText>{skill.name}</AnimatedText>
                  </span>
                ))}
              </div>
            </div>
          )}

          {education.length > 0 && (
            <div className="resume-section">
              <Title text={t('template.sections.education')} color={theme.accentColor} />
              <div className="space-y-4 pb-2">
                {education.map((edu, i) => (
                  <EducationInfo
                    key={i}
                    degree={edu.degree}
                    institution={edu.institution}
                    duration={`${formatYearMonth(edu.startDate)} - ${formatYearMonth(edu.endDate)}`}
                  />
                ))}
                <br />
              </div>
            </div>
          )}

          {visibleCertifications.length > 0 && (
            <div className="resume-section">
              <Title text={t('template.sections.certifications')} color={theme.accentColor} />
              <div className="space-y-2">
                {visibleCertifications.map((cert, i) => (
                  <CertificationInfo
                    key={i}
                    title={cert.title}
                    issuer={cert.issuer}
                    year={cert.year}
                    bgColor={theme.tagBackground}
                  />
                ))}
              </div>
            </div>
          )}

          {languages.length > 0 && (
            <div className="resume-section">
              <Title text={t('template.sections.languages')} color={theme.accentColor} />
              <div className="flex flex-wrap gap-2">
                {languages.map((lang, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ backgroundColor: theme.tagBackground, color: theme.headingColor }}
                  >
                    <AnimatedText>{lang.name}</AnimatedText>
                  </span>
                ))}
              </div>
            </div>
          )}

          {interests.length > 0 && interests.some((i) => i) && (
            <div className="resume-section">
              <Title text={t('template.sections.interests')} color={theme.accentColor} />
              <div className="flex flex-wrap gap-2">
                {interests.map((int, i) =>
                  int ? (
                    <span
                      key={i}
                      className="text-xs font-medium px-2 py-1 rounded"
                      style={{ backgroundColor: theme.tagBackground, color: theme.headingColor }}
                    >
                      <AnimatedText>{int}</AnimatedText>
                    </span>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateOne;
