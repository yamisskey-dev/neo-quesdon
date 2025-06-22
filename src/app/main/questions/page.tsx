'use client';

import Question from '@/app/_components/question';
import { useContext, useEffect, useRef, useState } from 'react';
import DialogModalTwoButton from '@/app/_components/modalTwoButton';
import DialogModalLoadingOneButton from '@/app/_components/modalLoadingOneButton';
import { questionDto } from '@/app/_dto/questions/question.dto';
import { MyQuestionEv } from '../_events';
import { Logger } from '@/utils/logger/Logger';
import { QuestionDeletedPayload } from '@/app/_dto/websocket-event/websocket-event.dto';
import { MyProfileContext } from '@/app/main/layout';
import { deleteQuestion } from '@/utils/questions/deleteQuestion';
import { createBlock } from '@/utils/block/createBlock';
import { onApiError } from '@/utils/api-error/onApiError';
import { useTranslation } from 'react-i18next';

const fetchQuestions = async (): Promise<questionDto[] | null> => {
  const res = await fetch('/api/db/questions');

  try {
    if (res.status === 401) {
      return null;
    } else if (!res.ok) {
      onApiError(res.status, res);
      return null;
    } else {
      return await res.json();
    }
  } catch {
    return null;
  }
};

export default function Questions() {
  const { t } = useTranslation();
  const [questions, setQuestions] = useState<questionDto[] | null>();
  const profile = useContext(MyProfileContext);
  const [id, setId] = useState<number>(0);
  const deleteQuestionModalRef = useRef<HTMLDialogElement>(null);
  const answeredQuestionModalRef = useRef<HTMLDialogElement>(null);
  const createBlockModalRef = useRef<HTMLDialogElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onNewQuestionEvent = (ev: CustomEvent<questionDto>) => {
    const logger = new Logger('onNewQuestion', { noColor: true });
    logger.log('New Question has arrived: ', ev.detail);
    setQuestions((prev) => (prev ? [ev.detail, ...prev] : []));
  };

  const onDeleteQuestionEvent = (ev: CustomEvent<QuestionDeletedPayload>) => {
    const logger = new Logger('onNewQuestion', { noColor: true });
    logger.log('Question Deleted: ', ev.detail);
    setQuestions((prev) => prev && prev.filter((el) => el.id !== ev.detail.deleted_id));
  };

  useEffect(() => {
    fetchQuestions().then((r) => {
      setQuestions(r);
    });
    MyQuestionEv.addCreatedEventListener(onNewQuestionEvent);
    MyQuestionEv.addDeletedEventListner(onDeleteQuestionEvent);

    return () => {
      MyQuestionEv.removeCreatedEventListener(onNewQuestionEvent);
      MyQuestionEv.removeDeletedEventListener(onDeleteQuestionEvent);
    };
  }, []);

  return (
    <div className="w-[90%] window:w-[80%] desktop:w-[70%] flex flex-col justify-center">
      <h3 className="text-3xl desktop:text-4xl mb-2">{t('questions.unanswered')}</h3>
      {questions === undefined ? (
        <div className="w-full flex justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <div className="w-full">
          {questions !== null ? (
            <div>
              {questions.length > 0 ? (
                <div>
                  {questions.map((el) => (
                    <div key={el.id}>
                      <Question
                        singleQuestion={el}
                        multipleQuestions={questions}
                        setId={setId}
                        setQuestions={setQuestions}
                        answerRef={answeredQuestionModalRef}
                        deleteRef={deleteQuestionModalRef}
                        blockingRef={createBlockModalRef}
                        setIsLoading={setIsLoading}
                        defaultVisibility={profile?.defaultPostVisibility}
                        defaultHideFromTimeline={profile?.defaultHideFromTimeline}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-fit p-4 glass rounded-box flex flex-col items-center shadow mb-2">
                  <h1 className="text-xl desktop:text-3xl">{t('questions.no_unanswered')}</h1>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full flex justify-center">
              <span className="text-2xl">{t('questions.not_logged_in')}</span>
            </div>
          )}
        </div>
      )}
      <DialogModalLoadingOneButton
        isLoading={isLoading}
        title_loading={t('questions.dialog_one_button_title_loading')}
        title_done={t('questions.dialog_one_button_title_done')}
        body_loading={t('questions.dialog_one_button_body_loading')}
        body_done={t('questions.dialog_one_button_body_done')}
        loadingButtonText={t('questions.dialog_one_button_loadingButtonText')}
        doneButtonText={t('questions.dialog_one_button_doneButtonText')}
        ref={answeredQuestionModalRef}
      />
      <DialogModalTwoButton
        title={t('questions.dialog_two_buttons_1_title')}
        body={t('questions.dialog_two_buttons_1_body')}
        confirmButtonText={t('questions.dialog_two_buttons_1_confirmButtonText')}
        cancelButtonText={t('questions.dialog_two_buttons_1_cancelButtonText')}
        ref={deleteQuestionModalRef}
        onClick={() => {
          deleteQuestion(id, onApiError);
        }}
      />
      <DialogModalTwoButton
        title={t('questions.dialog_two_buttons_2_title')}
        body={t('questions.dialog_two_buttons_2_body')}
        confirmButtonText={t('questions.dialog_two_buttons_2_confirmButtonText')}
        cancelButtonText={t('questions.dialog_two_buttons_2_cancelButtonText')}
        ref={createBlockModalRef}
        onClick={() => {
          createBlock(id, onApiError);
        }}
      />
    </div>
  );
}
