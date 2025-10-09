import React from 'react';
import openai from 'simple-icons/icons/openai';
import googlegemini from 'simple-icons/icons/googlegemini';
import anthropic from 'simple-icons/icons/anthropic';
import xai from 'simple-icons/icons/xai';

function Si({ icon, title }: { icon: { path:string;color:string }, title:string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden focusable="false" role="img" width="20" height="20">
      <path d={icon.path} fill={`#${icon.color}`} />
      <title>{title}</title>
    </svg>
  );
}

export const Brand = {
  ChatGPT:   <Si icon={openai}      title="chatgpt" />,
  Gemini:    <Si icon={googlegemini} title="gemini" />,
  Claude:    <Si icon={anthropic}   title="claude (anthropic)" />,
  Grok:      <Si icon={xai}         title="grok (x.ai)" />,
};
