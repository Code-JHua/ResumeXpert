import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatYearMonth } from "../utils/helper";
import { AnimatedText } from "./RenderResume";
import { FreeBlocksSection } from "./ResumeSection";

const TemplateThree = ({ resumeData = {}, containerWidth }) => {
  const { t } = useTranslation();
  const {
    profileInfo = {},
    contactInfo = {},
    education = [],
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
  const [baseWidth, setBaseWidth] = useState(1100);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (resumeRef.current) {
      const actualBaseWidth = resumeRef.current.offsetWidth;
      setBaseWidth(actualBaseWidth);
      if (containerWidth > 0) {
        setScale(containerWidth / actualBaseWidth);
      }
    }
  }, [containerWidth]);

  // Group skills by category
  const groupedSkills = {
    automationTools: [],
    productManagement: [],
    languages: [],
    otherSkills: []
  };

  skills.forEach(skill => {
    if (["Selenium/Webdriver", "TestNG", "Jenkins"].includes(skill.name)) {
      groupedSkills.automationTools.push(skill.name);
    } else if (["Agile", "Scrum", "JIRA", "Microsoft TFS"].includes(skill.name)) {
      groupedSkills.productManagement.push(skill.name);
    } else if (["Python", "Java", "Javascript", "Databases (MySQL)"].includes(skill.name)) {
      groupedSkills.languages.push(skill.name);
    } else {
      groupedSkills.otherSkills.push(skill.name);
    }
  });

  return (
    <div
      ref={resumeRef}
      className="bg-white font-sans a4-wrapper text-black max-w-screen-lg mx-auto"
      style={{
        transform: containerWidth > 0 ? `scale(${scale})` : "none",
        transformOrigin: "top left",
        width: containerWidth > 0 ? `${baseWidth}px` : "auto",
        height: "auto",
      }}
    >
      {/* Header Section */}
      <header className="px-8 pt-8 pb-4 mb-2">
        <div className="text-center">
          <h1 className="text-3xl font-bold uppercase mb-3"><AnimatedText>{profileInfo.fullName}</AnimatedText></h1>

          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            <AnimatedText>{profileInfo.designation}</AnimatedText>
          </h2>

        </div>

        <p className="text-sm text-gray-700 leading-tight mb-4">
          <AnimatedText>{profileInfo.summary}</AnimatedText>
        </p>
      </header>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-12 gap-4 px-8 pb-8">
        {/* LEFT SIDEBAR - 5 columns */}
        <aside className="col-span-5 space-y-5 pr-4 border-r border-gray-300">
          {/* Contact */}
          <section>
            <h2 className="text-sm font-bold uppercase text-gray-800 mb-2 tracking-wider">CONTACT</h2>
            <ul className="text-xs text-gray-700 space-y-2 pb-2">
              <li className="flex items-start">
                <span className="font-semibold min-w-[65px]">Location:</span>
                <AnimatedText>{contactInfo.location}</AnimatedText>
              </li>
              <li className="flex items-start">
                <span className="font-semibold min-w-[65px]">Phone:</span>
                <AnimatedText>{contactInfo.phone}</AnimatedText>
              </li>
              <li className="flex items-start">
                <span className="font-semibold min-w-[65px]">Email:</span>
                <a href={`mailto:${contactInfo.email}`}
                  className="text-blue-600 hover:underline">
                  <AnimatedText>{contactInfo.email}</AnimatedText>
                </a>
              </li>
              {contactInfo.linkedin && (
                <li className="flex items-start ">
                  <span className="font-semibold min-w-[65px]">{t('template.links.linkedin')}:</span>
                  <a href={contactInfo.linkedin}
                    className="text-blue-600 hover:underline truncate pb-1"
                    title={contactInfo.linkedin}>
                    linkedin.com/in/{contactInfo.linkedin.split('/').pop()}
                  </a>
                </li>
              )}
              {contactInfo.github && (
                <li className="flex items-start">
                  <span className="font-semibold min-w-[65px] ">{t('template.links.github')}:</span>
                  <a href={contactInfo.github}
                    className="text-blue-600 hover:underline pb-2 truncate"
                    title={contactInfo.github}>
                    github.com/{contactInfo.github.split('/').pop()}
                  </a>
                </li>
              )}
              {contactInfo.website && (
                <li className="flex items-start">
                  <span className="font-semibold min-w-[65px]">{t('template.links.portfolio')}:</span>
                  <a href={contactInfo.website}
                    className="text-blue-600 hover:underline pb-2 truncate"
                    title={contactInfo.website}>
                    {contactInfo.website.replace(/(^\w+:|^)\/\//, '')}
                  </a>
                </li>
              )}
            </ul>
          </section>

          {/* Skills */}
          <section>
            <h2 className="text-sm font-bold uppercase text-gray-800 mb-2 tracking-wider">{t('template.sections.skills')}</h2>
            {Object.entries(groupedSkills).map(([category, skillsList]) => (
              skillsList.length > 0 && (
                <div key={category} className="mb-2">
                  {category !== "otherSkills" && (
                    <h3 className="text-xs font-semibold italic mb-1">{t(`template.skills.${category}`)}:</h3>
                  )}
                  <ul className="text-xs text-gray-700">
                    {skillsList.map((skill, idx) => (
                      <li key={idx} className="mb-1"><AnimatedText>{skill}</AnimatedText></li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </section>

          {/* Education */}
          {education.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase text-gray-800 mb-3 tracking-wider">{t('template.sections.education')}</h2>
              <div className="space-y-3">
                {education.map((edu, idx) => (
                  <div key={idx} className="text-xs">
                    <h3 className="font-bold pb-2"><AnimatedText>{edu.institution}</AnimatedText></h3>
                    <p className=" pb-2 "><AnimatedText>{edu.degree}</AnimatedText></p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {visibleCertifications.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase text-gray-800 mb-2 tracking-wider">{t('template.sections.certifications')}</h2>
              <ul className="text-xs text-gray-700 space-y-1">
                {visibleCertifications.map((cert, idx) => (
                  <li key={idx}>
                    <AnimatedText>{`${cert.title}${cert.year ? ` (${cert.year})` : ''}`}</AnimatedText>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Interests */}
          {interests.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase text-gray-800 mb-2 tracking-wider">{t('template.sections.interests')}</h2>
              <ul className="text-xs text-gray-700 space-y-1">
                {interests.map((interest, idx) => (
                  <li key={idx}>• <AnimatedText>{interest}</AnimatedText></li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        {/* MAIN CONTENT - 7 columns */}
        <main className="col-span-7 space-y-5 pl-4">
          {/* Work Experience */}
          {workExperience.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase text-gray-800 mb-3 tracking-wider border-b border-gray-400 pb-1">{t('template.sections.workExperience')}</h2>
              <div className="space-y-5">
                {workExperience.map((exp, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <h3 className="font-bold pb-2"><AnimatedText>{exp.role}</AnimatedText></h3>
                        <p className="italic"><AnimatedText>{`${exp.company}${exp.location ? `, ${exp.location}` : ''}`}</AnimatedText></p>
                      </div>
                      {exp.startDate && exp.endDate && (
                        <div className="text-right italic">
                          <AnimatedText>{`${formatYearMonth(exp.startDate)} – ${formatYearMonth(exp.endDate)}`}</AnimatedText>
                        </div>
                      )}
                    </div>
                    <ul className="list-disc list-inside space-y-1 mt-1 pl-1">
                      {exp.description?.split("\n").map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                      {!exp.description && idx === 0}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase text-gray-800 mb-3 tracking-wider border-b border-gray-400 pb-1">{t('template.sections.projects')}</h2>
              <div className="space-y-4">
                {projects.map((proj, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold"><AnimatedText>{proj.title}</AnimatedText></h3>
                      {proj.startDate && proj.endDate && (
                        <div className="text-right italic">
                          <AnimatedText>{`${formatYearMonth(proj.startDate)} – ${formatYearMonth(proj.endDate)}`}</AnimatedText>
                        </div>
                      )}
                    </div>

                    <p className="mt-1 mb-1"><AnimatedText>{proj.description}</AnimatedText></p>

                    <div className="flex flex-wrap gap-2 mt-1">
                      {proj.github && (
                        <a href={proj.github}
                          className="text-blue-600 hover:underline flex items-center text-xs">
                          <AnimatedText>{t('template.links.github')}</AnimatedText>
                        </a>
                      )}
                      {proj.liveDemo && (
                        <a href={proj.liveDemo}
                          className="text-blue-600 hover:underline flex items-center text-xs">
                          <AnimatedText>{t('template.links.liveDemo')}</AnimatedText>
                        </a>
                      )}
                      {proj.technologies && (
                        <span className="text-gray-600">
                          <strong>Tech:</strong> <AnimatedText>{proj.technologies.join(", ")}</AnimatedText>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {freeBlocks.length > 0 && (
            <section>
              <h2 className="text-sm font-bold uppercase text-gray-800 mb-3 tracking-wider border-b border-gray-400 pb-1">Additional Information</h2>
              <FreeBlocksSection blocks={freeBlocks} itemClassName="mb-4 last:mb-0" />
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default TemplateThree;
