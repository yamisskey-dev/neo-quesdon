'use client';

import DialogModalLoadingOneButton from '@/app/_components/modalLoadingOneButton';
import DialogModalTwoButton from '@/app/_components/modalTwoButton';
import NameComponents from '@/app/_components/NameComponents';
import { SearchBlockListResDto } from '@/app/_dto/blocking/blocking.dto';
import { CreateQuestionDto } from '@/app/_dto/questions/create-question.dto';
import { userProfileDto } from '@/app/_dto/fetch-profile/Profile.dto';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { FaEllipsisVertical } from 'react-icons/fa6';
import { getProxyUrl } from '@/utils/getProxyUrl/getProxyUrl';
import { onApiError } from '@/utils/api-error/onApiError';
import { useTranslation } from 'react-i18next';
import { FaInfoCircle } from 'react-icons/fa';

type FormValue = {
  question: string;
  nonAnonQuestion: boolean;
};

async function fetchProfile(handle: string) {
  const res = await fetch(`/api/db/fetch-profile/${handle}`);
  if (res.ok) {
    return res.json() as unknown as userProfileDto;
  } else {
    onApiError(res.status, res);
    return undefined;
  }
}

export default function Profile() {
  const { t } = useTranslation();
  const { handle } = useParams() as { handle: string };
  const profileHandle = decodeURIComponent(handle);

  const [userProfile, setUserProfile] = useState<userProfileDto>();
  const [localHandle, setLocalHandle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUserBlocked, setIsUserBlocked] = useState<boolean>(false);
  const [questionSendingDoneMessage, setQuestionSendingDoneMessage] = useState<{ title: string; body: string }>({
    title: t('common.success'),
    body: t('profile.question_sent'),
  });
  const questionSendingModalRef = useRef<HTMLDialogElement>(null);
  const blockConfirmModalRef = useRef<HTMLDialogElement>(null);
  const blockSuccessModalRef = useRef<HTMLDialogElement>(null);
  const unblockConfirmModalRef = useRef<HTMLDialogElement>(null);
  const unblockSuccessModalRef = useRef<HTMLDialogElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    trigger,
    getValues,
    setError,
    formState: { errors },
  } = useForm<FormValue>({
    defaultValues: {
      question: '',
      nonAnonQuestion: false,
    },
  });

  const nonAnonQuestion = watch('nonAnonQuestion');

  const onCtrlEnter = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      const isValid = await trigger();

      if (isValid === false) {
        return;
      } else {
        const value = getValues();
        if (value && !questionSendingModalRef.current?.open) {
          await onSubmit(value);
        }
      }
    }
  };

  /**
   * @throws throw only when fetch throws exception
   * @param q CreateQuestionDto
   * @returns create question API 에서 받은 Response
   */
  const mkQuestionCreateApi = async (q: CreateQuestionDto): Promise<Response> => {
    try {
      const res = await fetch('/api/db/questions', {
        method: 'POST',
        body: JSON.stringify(q),
      });
      return res;
    } catch (err) {
      // fetch 자체가 throw 된 경우만 여기서 alert하고 status code가 성공이 아닌 경우는 별도로 핸들링
      setIsLoading(false);
      setQuestionSendingDoneMessage({ title: '에러', body: `질문을 보내는데 실패했어요! ${err}` });
      throw err;
    }
  };

  const shareUrl = () => {
    const server = localStorage.getItem('server');
    const text = `${userProfile?.name}${t('profile.inbox')} #neo_quesdon ${location.origin}/main/user/${userProfile?.handle}`;
    return `https://${server}/share?text=${encodeURIComponent(text)}`;
  };

  // 차단하는 함수
  const handleBlock = async () => {
    setIsLoading(true);
    blockSuccessModalRef.current?.showModal();
    const res = await fetch('/api/user/blocking/create', {
      method: 'POST',
      body: JSON.stringify({ targetHandle: profileHandle }),
    });
    if (!res.ok) {
      onApiError(res.status, res);
      setIsLoading(false);
    }
    setIsUserBlocked(true);
    setIsLoading(false);
  };

  // 차단 해제하는 함수
  const handleUnBlock = async () => {
    setIsLoading(true);
    unblockSuccessModalRef.current?.showModal();
    const res = await fetch('/api/user/blocking/delete', {
      method: 'POST',
      body: JSON.stringify({ targetHandle: profileHandle }),
    });
    if (!res.ok) {
      onApiError(res.status, res);
      setIsLoading(false);
    }
    setIsUserBlocked(false);
    setIsLoading(false);
  };

  const onSubmit: SubmitHandler<FormValue> = async (e) => {
    const user_handle = localStorage.getItem('user_handle');
    const detectWhiteSpaces = new RegExp(/^\s+$/);

    // 작성자 공개
    if (nonAnonQuestion === true) {
      if (user_handle === null) {
        setError('nonAnonQuestion', {
          type: 'notLoggedIn',
          message: t('error.login_required_for_public_question')
        });
        return;
      }
      if (detectWhiteSpaces.test(e.question) === true) {
        setError('question', {
          type: 'questionOnlyWhiteSpace',
          message: t('error.empty_question')
        });
        return;
      }

      const req: CreateQuestionDto = {
        question: e.question,
        isAnonymous: !nonAnonQuestion,
        questionee: profileHandle,
      };
      reset();
      setIsLoading(true);
      questionSendingModalRef.current?.showModal();
      const res = await mkQuestionCreateApi(req);

      if (res.ok) {
        setIsLoading(false);
      } else {
        setIsLoading(false);
        setQuestionSendingDoneMessage({ 
          title: t('user.profile.error.title'), 
          body: t('user.profile.error.send_failed', { error: await res.text() })
        });
      }
    }
    // 작성자 비공개
    else {
      if (userProfile?.stopAnonQuestion === true) {
        setError('nonAnonQuestion', {
          type: 'stopAnonQuestion',
          message: t('error.anonymous_questions_not_accepted')
        });
        return;
      } else {
        if (detectWhiteSpaces.test(e.question) === true) {
          setError('question', {
            type: 'questionOnlyWhiteSpace',
            message: t('error.empty_question')
          });
          return;
        }

        const req: CreateQuestionDto = {
          question: e.question,
          isAnonymous: !nonAnonQuestion,
          questionee: profileHandle,
        };
        reset();
        setIsLoading(true);
        questionSendingModalRef.current?.showModal();
        const res = await mkQuestionCreateApi(req);
        if (res.ok) {
          setIsLoading(false);
          setQuestionSendingDoneMessage({ 
            title: t('common.success'),
            body: t('profile.question_sent')
          });
        } else {
          setIsLoading(false);
          setQuestionSendingDoneMessage({ 
            title: t('common.error'),
            body: t('profile.question_send_failed', {error: await res.text()})
          });
        }
      }
    }
  };

  useEffect(() => {
    fetchProfile(profileHandle).then((r) => {
      setUserProfile(r);
    });
  }, []);

  useEffect(() => {
    setLocalHandle(localStorage.getItem('user_handle'));
    if (localHandle) {
      (async () => {
        const res = await fetch('/api/user/blocking/find', {
          method: 'POST',
          body: JSON.stringify({ targetHandle: profileHandle }),
        });
        if (!res.ok) {
          onApiError(res.status, res);
        }
        const data = (await res.json()) as SearchBlockListResDto;
        setIsUserBlocked(data.isBlocked);
      })();
    }
  }, [localHandle]);

  return (
    <div className="w-full h-fit desktop:sticky top-2 flex flex-col">
      <div className="h-fit p-2 glass rounded-box flex flex-col items-center shadow mb-2">
        <div className="flex flex-col items-center">
          {localHandle !== profileHandle && localHandle !== null && (
            <div tabIndex={0} className="dropdown dropdown-end size-fit absolute top-2 right-2">
              <div className="flex btn btn-ghost btn-circle text-slate-600 dark:text-slate-200">
                <FaEllipsisVertical size={20} />
              </div>
              <ul tabIndex={0} className="flex dropdown-content menu bg-base-100 z-10 rounded-box w-40 p-2 shadow">
                {isUserBlocked ? (
                  <li>
                    <a className="w-full" onClick={() => unblockConfirmModalRef.current?.showModal()}>
                      차단 해제
                    </a>
                  </li>
                ) : (
                  <li>
                    <a className="w-full hover:bg-red-500" onClick={() => blockConfirmModalRef.current?.showModal()}>
                      차단
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}
          {userProfile && userProfile.avatarUrl ? (
            <div className="flex w-full h-24 mb-2">
              <Link href={`https://${userProfile.hostname}/${userProfile.handle.match(/^@([^@ ]){1,100}/g)?.[0]}`}>
                <img
                  src={getProxyUrl(userProfile.avatarUrl)}
                  alt="User Avatar"
                  className={`w-24 h-24 object-cover absolute left-[calc(50%-3rem)] rounded-full`}
                />
              </Link>
              {userProfile.stopAnonQuestion && !userProfile.stopNewQuestion && (
                <div className="chat chat-end w-32 window:w-full desktop:w-full relative bottom-[40%] right-[22%] window:right-[60%] deskstop:left-[60%]">
                  <div className="chat-bubble text-xs flex items-center bg-base-100 text-slate-700 dark:text-slate-400">
                    {t('profile.only_public_questions')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="skeleton h-24 w-24 rounded-full" />
          )}
          <div className="flex items-center text-xl mb-2">
            {userProfile && userProfile.stopNewQuestion ? (
              <div className="flex flex-col items-center">
                <NameComponents username={userProfile.name} width={32} height={32} />
                <span>{t('profile.none')}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center window:text-2xl">
                <NameComponents username={userProfile?.name} width={32} height={32} />
                <span>{t('profile.inbox')}</span>
              </div>
            )}
          </div>
        </div>
        {userProfile?.announcement && (
          <div className="mb-2 p-2 w-[90%] flex items-center gap-2 border border-indigo-400 dark:border-indigo-200 rounded-lg">
            <FaInfoCircle className='flex-shrink-0' />
            <span className='grow break-all'>{userProfile.announcement}</span>
          </div>
        )}
        <form className="w-full flex flex-col items-center" onSubmit={handleSubmit(onSubmit)}>
          <textarea
            {...register('question', {
              required: 'required',
              maxLength: 1000,
            })}
            placeholder={t('profile.placeholder')}
            className={`w-[90%] mb-2 font-thin leading-loose textarea ${errors.question ? 'textarea-error' : 'textarea-bordered'
              }`}
            onKeyDown={onCtrlEnter}
            disabled={userProfile?.stopNewQuestion === true ? true : false}
            style={{ resize: 'none' }}
          />
          {errors.nonAnonQuestion && errors.nonAnonQuestion.type === 'stopAnonQuestion' && (
            <div
              className="tooltip tooltip-open tooltip-bottom tooltip-error transition-opacity"
              data-tip={errors.nonAnonQuestion.message}
            />
          )}
          {errors.nonAnonQuestion && errors.nonAnonQuestion.type === 'notLoggedIn' && (
            <div
              className="tooltip tooltip-open tooltip-bottom tooltip-error transition-opacity"
              data-tip={errors.nonAnonQuestion.message}
            />
          )}
          {errors.question && errors.question.type === 'questionOnlyWhiteSpace' && (
            <div
              className="tooltip tooltip-open tooltip-bottom tooltip-error transition-opacity"
              data-tip={errors.question.message}
            />
          )}
          <div className="w-[90%] flex justify-between">
            <div className="flex gap-2 items-center">
              <input
                type="checkbox"
                className="toggle toggle-accent"
                onClick={() => setValue('nonAnonQuestion', !nonAnonQuestion)}
              />
              <input type="hidden" {...register('nonAnonQuestion')} />
              <span>{t('profile.author')}</span>
            </div>
            <button type="submit" className="btn btn-primary">
              {t('profile.submit')}
            </button>
          </div>
        </form>
      </div>
      {localHandle === profileHandle && (
        <div className="h-fit py-4 glass rounded-box flex flex-col items-center shadow mb-2 dark:text-white">
          <a className="link" href={shareUrl()} target="_blank" rel="noreferrer">
            {userProfile?.instanceType}{t('profile.share')}
          </a>
        </div>
      )}
      <DialogModalLoadingOneButton
        isLoading={isLoading}
        title_loading={t('modal.sending')}
        title_done={questionSendingDoneMessage.title}
        body_loading={t('modal.sending_question')}
        body_done={questionSendingDoneMessage.body}
        loadingButtonText={t('common.loading')}
        doneButtonText={t('common.close')}
        ref={questionSendingModalRef}
      />
      <DialogModalTwoButton
        title={t('modal.block')}
        body={t('modal.block_confirmation')}
        confirmButtonText={t('common.confirm')}
        onClick={handleBlock}
        cancelButtonText={t('common.cancel')}
        ref={blockConfirmModalRef}
      />
      <DialogModalLoadingOneButton
        isLoading={isLoading}
        title_loading={t('modal.block')}
        title_done={t('modal.block')}
        body_loading={t('modal.blocking')}
        body_done={t('modal.blocked')}
        loadingButtonText={t('common.loading')}
        doneButtonText={t('common.close')}
        ref={blockSuccessModalRef}
      />
      <DialogModalTwoButton
        title={t('modal.unblock')}
        body={t('modal.unblock_confirmation')}
        confirmButtonText={t('common.confirm')}
        onClick={handleUnBlock}
        cancelButtonText={t('common.cancel')}
        ref={unblockConfirmModalRef}
      />
      <DialogModalLoadingOneButton
        isLoading={isLoading}
        title_loading={t('modal.unblock')}
        title_done={t('modal.unblock')}
        body_loading={t('modal.unblocking')}
        body_done={t('modal.unblocked')}
        loadingButtonText={t('common.loading')}
        doneButtonText={t('common.close')}
        ref={unblockSuccessModalRef}
      />
    </div>
  );
}
