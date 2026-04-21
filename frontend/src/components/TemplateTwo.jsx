"use client";
import React, { useEffect, useRef, useState } from "react";
import { LuExternalLink, LuGithub } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { formatYearMonth } from "../utils/helper";
import { AnimatedText } from "./RenderResume";
import { FreeBlocksSection } from "./ResumeSection";

const sectionTitleClass = "text-base font-bold uppercase tracking-wide mb-1 pb-1 border-b border-gray-300";

const TemplateTwo = ({ resumeData = {}, containerWidth }) => {
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
      className="resume-section p-4 bg-white font-sans text-black max-w-4xl mx-auto"
      style={{
        transform: containerWidth > 0 ? `scale(${scale})` : undefined,
        transformOrigin: "top left",
        width: containerWidth > 0 ? `${baseWidth}px` : undefined,
        height: "1123px",
        overflow: "hidden",
      }}
    >
      {/* Header Section */}
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold tracking-tight mb-2"><AnimatedText>{profileInfo.fullName}</AnimatedText></h1>
        <p className="text-sm text-gray-600 font-medium mb-2"><AnimatedText>{profileInfo.designation}</AnimatedText></p>
        <div className="flex flex-wrap justify-center gap-1 text-[11px] text-gray-700">
          {contactInfo.phone && <span><AnimatedText>{contactInfo.phone}</AnimatedText></span>}
          {contactInfo.email && (
            <a href={`mailto:${contactInfo.email}`} className="hover:underline text-blue-600">
              <AnimatedText>{contactInfo.email}</AnimatedText>
            </a>
          )}
          {contactInfo.linkedin && (
            <a href={contactInfo.linkedin} className="hover:underline text-blue-600">
              <AnimatedText>{t('template.links.linkedin')}</AnimatedText>
            </a>
          )}
          {contactInfo.github && (
            <a href={contactInfo.github} className="hover:underline text-blue-600">
              <AnimatedText>{t('template.links.github')}</AnimatedText>
            </a>
          )}
          {contactInfo.website && (
            <a href={contactInfo.website} className="hover:underline text-blue-600">
              <AnimatedText>{t('template.links.portfolio')}</AnimatedText>
            </a>
          )}
        </div>
      </div>

      <hr className="border-gray-300 mb-2" />

      {/* Summary */}
      {profileInfo.summary && (
        <section className="mb-2">
          <h2 className={sectionTitleClass}>{t('template.sections.summary')}</h2>
          <p className="text-[11px] text-gray-800 leading-tight"><AnimatedText>{profileInfo.summary}</AnimatedText></p>
        </section>
      )}

      {/* Experience */}
      {workExperience.length > 0 && (
        <section className="mb-2">
          <h2 className={sectionTitleClass}>{t('template.sections.experience')}</h2>
          <div className="space-y-2">
            {workExperience.map((exp, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-[12px] pb-2 text-gray-800"><AnimatedText>{exp.role}</AnimatedText></h3>
                    <p className="italic text-[11px] pb-2 text-gray-600"><AnimatedText>{exp.company}</AnimatedText></p>
                  </div>
                  <div className="text-[11px] text-right text-gray-600">
                    <p className="italic">
                      <AnimatedText>{`${formatYearMonth(exp.startDate)} - ${formatYearMonth(exp.endDate)}`}</AnimatedText>
                    </p>
                    {exp.location && <p className="text-[11px]"><AnimatedText>{exp.location}</AnimatedText></p>}
                  </div>
                </div>
                {exp.technologies && (
                  <p className="bg-gray-100 text-[10px] font-mono px-1.5 py-0.5 rounded inline-block">
                    <AnimatedText>{exp.technologies}</AnimatedText>
                  </p>
                )}
                <ul className=" mt-0.5 text-[12px] text-gray-700">
                  {exp.description?.split("\n").map((line, i) => (
                    <li key={i} className="pb-1">{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="mb-2">
          <h2 className={sectionTitleClass}>{t('template.sections.projects')}</h2>
          <div className="space-y-2">
            {projects.map((proj, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-[12px] text-gray-800"><AnimatedText>{proj.title}</AnimatedText></h3>
                  {proj.link && (
                    <a href={proj.link} className="text-blue-600 text-[11px] hover:underline">
                      <AnimatedText>{proj.linkType || t('template.links.link')}</AnimatedText>
                    </a>
                  )}
                </div>
                {proj.technologies && (
                  <p className="bg-gray-100 pb-2 text-[10px] font-mono px-1.5 py-0.5 rounded inline-block">
                    <AnimatedText>{proj.technologies}</AnimatedText>
                  </p>
                )}
                <p className="text-[11px] pb-2 text-gray-700 "><AnimatedText>{proj.description}</AnimatedText></p>
                <div className="flex gap-1 mt-0.5 pt-2 text-[11px]">
                  {proj.github && (
                    <a href={proj.github} className="flex items-center gap-0.5 hover:underline text-blue-600">
                      <LuGithub size={10} /> <AnimatedText>{t('template.links.github')}</AnimatedText>
                    </a>
                  )}
                  {proj.liveDemo && (
                    <a href={proj.liveDemo} className="flex items-center gap-0.5 hover:underline text-blue-600">
                      <LuExternalLink size={10} /> <AnimatedText>{t('template.links.demo')}</AnimatedText>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="mb-2">
          <h2 className={sectionTitleClass}>{t('template.sections.education')}</h2>
          <div className="space-y-1">
            {education.map((edu, idx) => (
              <div key={idx} className="space-y-0.25">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-[12px] pb-2 text-gray-800"><AnimatedText>{edu.degree}</AnimatedText></h3>
                  <p className="italic text-[11px] pb-2 text-gray-600">
                    <AnimatedText>{`${formatYearMonth(edu.startDate)} - ${formatYearMonth(edu.endDate)}`}</AnimatedText>
                  </p>
                </div>
                <p className="italic text-[11px] text-gray-700"><AnimatedText>{edu.institution}</AnimatedText></p>
                {edu.courses && (
                  <p className="text-[11px]">
                    <strong>Courses:</strong> <AnimatedText>{edu.courses}</AnimatedText>
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-2">
          <h2 className={sectionTitleClass}>{t('template.sections.skills')}</h2>
          <ul className="text-[11px] text-gray-800 flex flex-wrap gap-1">
            {skills.map((skill, idx) => (
              <li key={idx} className="w-fit"><AnimatedText>{skill.name}</AnimatedText></li>
            ))}
          </ul>
        </section>
      )}

      {/* Certifications */}
      {visibleCertifications.length > 0 && (
        <section className="mb-2">
          <h2 className={sectionTitleClass}>{t('template.sections.certifications')}</h2>
          <ul className="list-disc list-inside text-[11px] text-gray-700">
            {visibleCertifications.map((cert, idx) => (
              <li key={idx} className="leading-tight">
                <AnimatedText>{`${cert.title}${cert.issuer ? ` — ${cert.issuer}` : ''}${cert.year ? ` (${cert.year})` : ''}`}</AnimatedText>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Languages & Interests */}
      {(languages.length > 0 || interests.length > 0) && (
        <section className="mb-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {languages.length > 0 && (
              <div>
                <h2 className={sectionTitleClass}>{t('template.sections.languages')}</h2>
                <ul className="flex flex-wrap gap-1 text-[11px] text-gray-700">
                  {languages.map((lang, idx) => (
                    <li key={idx} className="bg-gray-100 px-1.5 py-0.5 rounded-full">
                      <AnimatedText>{lang.name}</AnimatedText>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {interests.length > 0 && interests.some(Boolean) && (
              <div>
                <h2 className={sectionTitleClass}>{t('template.sections.interests')}</h2>
                <ul className="flex flex-wrap gap-1 text-[11px] text-gray-700">
                  {interests.filter(Boolean).map((int, idx) => (
                    <li key={idx} className="bg-gray-100 px-1.5 py-0.5 rounded-full">
                      <AnimatedText>{int}</AnimatedText>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {freeBlocks.length > 0 && (
        <section className="mt-2">
          <h2 className={sectionTitleClass}>Additional Information</h2>
          <FreeBlocksSection blocks={freeBlocks} itemClassName="mb-3 last:mb-0" />
        </section>
      )}
    </div>
  );
};

export default TemplateTwo;
