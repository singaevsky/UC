"use client";

import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { FaqItem } from '@/types/blog';

export default function FAQItem({ item }: { item: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClientComponentClient();

  return (
    <div id={`faq-${item.id}`} className="faq-item">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="faq-question"
      >
        <span>{item.question}</span>
        <span className={`faq-toggle ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="faq-answer">
          <div dangerouslySetInnerHTML={{ __html: item.answer }} />
        </div>
      )}
    </div>
  );
}
