'use client';

import { useContext, useEffect, useState } from 'react';
import Answer from '@/app/_components/answer';
import { FaExclamationCircle } from 'react-icons/fa';
import { AnswersContext } from './layout';
import { AnswerEv } from './_events';
import { useTranslation } from 'react-i18next';

export default function MainBody() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState<HTMLDivElement | null>(null);
  const answersContext = useContext(AnswersContext);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && answersContext?.untilId !== null) {
          AnswerEv.sendFetchMoreRequestEvent(answersContext?.untilId);
        }
      },
      {
        threshold: 0.7,
      },
    );
    if (mounted) observer.observe(mounted);
    return () => {
      if (mounted) observer.unobserve(mounted);
    };
  }, [mounted, answersContext?.untilId]);

  return (
    <div className="w-[90%] window:w-[80%] desktop:w-[70%]">
      <h3 className="text-3xl desktop:text-4xl mb-2">{t('main.answers')}</h3>
      {answersContext?.answers === null ? (
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <div>
          {answersContext?.answers && answersContext.answers.length > 0 ? (
            <div className="flex flex-col">
              {answersContext.answers.map((r) => (
                <div key={r.id}>
                  <Answer id={r.id} value={r} />
                </div>
              ))}
              <div className="w-full h-16 flex justify-center items-center" ref={(ref) => setMounted(ref)}>
                {answersContext.loading ? (
                  <div>
                    <span className="loading loading-spinner loading-lg" />
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl">{t('main.done')}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-3xl my-2 p-2">
              <FaExclamationCircle />
              <span>{t('main.nothing')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
