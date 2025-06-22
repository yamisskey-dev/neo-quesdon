'use client';

import NameComponents from '@/app/_components/NameComponents';

import { useContext, useEffect, useRef, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { UserSettingsUpdateDto } from '@/app/_dto/settings/settings.dto';
import { $Enums } from '@prisma/client';
import BlockList from '@/app/main/settings/_table';
import CollapseMenu from '@/app/_components/collapseMenu';
import DialogModalTwoButton from '@/app/_components/modalTwoButton';
import { AccountCleanReqDto } from '@/app/_dto/account-clean/account-clean.dto';
import { FaLock, FaUserLargeSlash } from 'react-icons/fa6';
import { MdDeleteForever, MdDeleteSweep, MdOutlineCleaningServices } from 'react-icons/md';
import { MyProfileContext } from '@/app/main/layout';
import { MyProfileEv } from '@/app/main/_events';
import { getProxyUrl } from '@/utils/getProxyUrl/getProxyUrl';
import { onApiError } from '@/utils/api-error/onApiError';
import { useTranslation } from 'react-i18next';
import { AccountDeleteReqDto } from '@/app/_dto/account-delete/account-delete.dto';

export type FormValue = {
  stopAnonQuestion: boolean;
  stopNewQuestion: boolean;
  stopNotiNewQuestion: boolean;
  stopPostAnswer: boolean;
  questionBoxName: string;
  visibility: $Enums.PostVisibility;
  wordMuteList: string;
};
async function updateUserSettings(value: FormValue) {
  const body: UserSettingsUpdateDto = {
    stopAnonQuestion: value.stopAnonQuestion,
    stopNewQuestion: value.stopNewQuestion,
    stopNotiNewQuestion: value.stopNotiNewQuestion,
    stopPostAnswer: value.stopPostAnswer,
    questionBoxName: value.questionBoxName || '질문함',
    defaultPostVisibility: value.visibility,
    wordMuteList: value.wordMuteList
      .split('\n')
      .map((v) => v.trim())
      .filter((v) => v.length > 0)
      .map((word) => word.replace(/^\/|\/[igmsuy]{0,6}$/g, '')),
  };
  try {
    const res = await fetch('/api/user/settings', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-type': 'application/json',
      },
    });
    if (!res.ok) {
      onApiError(res.status, res);
      return;
    }
    MyProfileEv.SendUpdateReq({ ...body });
  } catch (err) {
    throw err;
  }
}

function Divider({ className }: { className?: string }) {
  return <div className={`w-full window:w-[90%] desktop:w-full my-4 border-b ${className}`} />;
}

export default function Settings() {
  const { t } = useTranslation();
  const userInfo = useContext(MyProfileContext);
  const [buttonClicked, setButtonClicked] = useState<boolean>(false);
  const [defaultFormValue, setDefaultFormValue] = useState<FormValue>();
  const logoutAllModalRef = useRef<HTMLDialogElement>(null);
  const accountCleanModalRef = useRef<HTMLDialogElement>(null);
  const accountDeleteModalRef = useRef<HTMLDialogElement>(null);
  const importBlockModalRef = useRef<HTMLDialogElement>(null);
  const deleteAllQuestionsModalRef = useRef<HTMLDialogElement>(null);
  const deleteAllNotificationsModalRef = useRef<HTMLDialogElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValue>({
    values: defaultFormValue,
  });

  const formValues = watch();
  useEffect(() => {
    if (userInfo) {
      const value = {
        stopAnonQuestion: userInfo.stopAnonQuestion,
        stopNewQuestion: userInfo.stopNewQuestion,
        stopNotiNewQuestion: userInfo.stopNotiNewQuestion,
        stopPostAnswer: userInfo.stopPostAnswer,
        questionBoxName: userInfo.questionBoxName,
        visibility: userInfo.defaultPostVisibility,
        wordMuteList: userInfo.wordMuteList.join('\n'),
      };
      setDefaultFormValue(value);
    }
  }, [userInfo]);

  const onSubmit: SubmitHandler<FormValue> = async (value) => {
    if (userInfo) {
      updateUserSettings(value);
      setButtonClicked(true);
      setTimeout(() => {
        setButtonClicked(false);
      }, 2000);
    }
  };
  const onLogoutAll = async () => {
    setButtonClicked(true);
    const res = await fetch('/api/user/logout-all', { method: 'POST' });
    if (res.ok) {
      localStorage.removeItem('user_handle');
      window.location.href = '/';
    } else {
      onApiError(res.status, res);
      setButtonClicked(false);
      return;
    }
    setTimeout(() => {
      setButtonClicked(false);
    }, 2000);
  };

  const onAccountClean = async () => {
    setButtonClicked(true);
    const user_handle = userInfo?.handle;
    if (!user_handle) {
      return;
    }
    const req: AccountCleanReqDto = {
      handle: user_handle,
    };
    const res = await fetch('/api/user/account-clean', {
      method: 'POST',
      body: JSON.stringify(req),
      headers: { 'content-type': 'application/json' },
    });
    if (res.ok) {
      console.log('계정청소 시작됨...');
    } else {
      onApiError(res.status, res);
    }
    setTimeout(() => {
      setButtonClicked(false);
    }, 2000);
  };

  const onAccountDelete = async () => {
    setButtonClicked(true);
    setTimeout(() => {
      setButtonClicked(false);
    }, 2000);
    const user_handle = userInfo?.handle;
    if (!user_handle) {
      return;
    }
    const req: AccountDeleteReqDto = {
      handle: user_handle,
    };
    const res = await fetch('/api/user/account-delete', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    if (res.ok) {
      localStorage.removeItem('user_handle');
      localStorage.removeItem('last_token_refresh');
      await fetch('/api/web/logout');
      window.location.replace('/');
    } else {
      onApiError(res.status, res);
    }
  };

  const onImportBlock = async () => {
    setButtonClicked(true);
    const res = await fetch('/api/user/blocking/import', {
      method: 'POST',
    });
    if (res.ok) {
      console.log('블락 리스트 가져오기 시작됨...');
    } else {
      onApiError(res.status, res);
    }
    setTimeout(() => {
      setButtonClicked(false);
    }, 2000);
  };

  const onDeleteAllQuestions = async () => {
    setButtonClicked(true);
    const res = await fetch('/api/db/questions', {
      method: 'DELETE',
    });
    setButtonClicked(false);
    if (!res.ok) {
      throw new Error('질문을 모두 삭제하는데 실패했어요!');
    }
  };

  const onDeleteAllNotifications = async () => {
    setButtonClicked(true);
    const res = await fetch('/api/user/notification', {
      method: 'DELETE',
    });
    setButtonClicked(false);
    if (!res.ok) {
      throw new Error('알림을 삭제하는데 실패했어요!');
    }
  };

  return (
    <div className="w-[90%] window:w-[80%] desktop:w-[70%] glass flex flex-col desktop:grid desktop:grid-cols-2 gap-0 rounded-box shadow p-2 dark:text-white">
      {userInfo === undefined ? (
        <div className="w-full flex col-span-3 justify-center">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <>
          {userInfo === null || defaultFormValue === undefined ? (
            <div className="w-full flex col-span-3 justify-center">
              <span className="text-2xl">로그인이 안 되어있어요!</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col mt-2 gap-2 col-span-2 justify-center items-center">
                <div className="avatar">
                  <div className="ring-primary ring-offset-base-100 w-24 h-24 rounded-full ring ring-offset-2">
                    {userInfo?.avatarUrl !== undefined && (
                      <img src={getProxyUrl(userInfo.avatarUrl)} alt="User Avatar" className="rounded-full" />
                    )}
                  </div>
                </div>
                <div className="desktop:ml-2 flex flex-col items-center desktop:items-start">
                  <div className="flex text-2xl items-center">
                    <NameComponents username={userInfo?.name} width={24} height={24} />
                  </div>
                </div>
              </div>
              <div className="flex flex-col col-span-2 items-center">
                <div className="text-3xl flex justify-center mt-4 w-full window:w-[90%] desktop:w-full">
                  <span>{t('settings.window')}</span>
                </div>
                <Divider />
                <div className="w-full window:w-[70%] flex flex-col desktop:w-full gap-2 desktop:grid desktop:grid-cols-2">
                  {userInfo && (
                    <>
                      <CollapseMenu id={'basicSetting'} text={t('settings.preferences')}>
                        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col items-center">
                          <div className="grid grid-cols-[20%_80%] desktop:w-[24rem] desktop:grid-cols-[7rem_100%] gap-2 items-center p-2">
                            <input {...register('stopNewQuestion')} type="checkbox" className="toggle toggle-success" />
                            <span className="font-thin">{t('settings.stop')}</span>
                            
                            <input
                              {...register('stopAnonQuestion')}
                              type="checkbox"
                              className="toggle toggle-success" 
                              disabled={formValues.stopNewQuestion}
                            />
                            <span className="font-thin">{t('settings.refuse')}</span>

                            <input
                              {...register('stopNotiNewQuestion')}
                              type="checkbox"
                              className="toggle toggle-success"
                              disabled={formValues.stopNewQuestion}
                            />
                            <span className="font-thin">{t('settings.stop_notification_dm')}</span>

                            <input {...register('stopPostAnswer')} type="checkbox" className="toggle toggle-success" />
                            <span className="font-thin">{t('settings.stop_post_answer')}</span>

                            <div className="w-fit col-span-2 desktop:grid desktop:grid-cols-subgrid flex flex-col-reverse justify-center desktop:items-center gap-2 ml-[calc(20%+8px)] desktop:ml-0">
                              <select
                                {...register('visibility')}
                                className="select select-ghost select-sm w-fit"
                                disabled={formValues.stopPostAnswer}
                              >
                                <option value="public">{t('settings.visibility.public')}</option>
                                <option value="home">{t('settings.visibility.home')}</option>
                                <option value="followers">{t('settings.visibility.followers')}</option>
                              </select>
                              <span className="font-thin">{t('settings.answer_visibility')}</span>
                            </div>

                            <div className="col-start-2 flex flex-col-reverse gap-2">
                              <input
                                {...register('questionBoxName', {
                                  maxLength: 10,
                                })} 
                                type="text"
                                placeholder={t('settings.questionbox')}
                                className={`input input-bordered input-sm w-48 ${
                                  errors.questionBoxName?.type === 'maxLength' && 'input-error'
                                }`}
                              />
                              <span className="font-thin">{t('settings.inbox_name_limit')}</span>
                            </div>
                          </div>
                          <Divider />
                          <div className="flex flex-col desktop:w-[24rem] gap-2 items-center p-2">
                            <div className="text-lg">{t('settings.word_mute')}</div>
                            <div className="font-thin">
                              {t('settings.word_mute_description')} <br />
                              {t('settings.regex_support')}
                            </div>
                            <textarea
                              {...register('wordMuteList')}
                              className="textarea textarea-bordered w-full min-h-[15vh] text-base"
                              placeholder={t('settings.word_mute_placeholder')}
                            ></textarea>
                          </div>
                          <div className="flex w-full justify-end mt-2">
                            <button type="submit" className={`btn ${buttonClicked ? 'btn-disabled' : 'btn-primary'}`}>
                              {buttonClicked ? t('settings.please_wait') : '저장'}
                            </button>
                          </div>
                        </form>
                      </CollapseMenu>
                      <div className="flex justify-center">
                        <BlockList />
                      </div>
                      <CollapseMenu id={'securitySettings'} text={t('settings.security')}>
                        <div className="w-full flex flex-col items-center">
                          <span className="font-normal text-xl py-3 flex items-center gap-2">
                            <FaLock />
                            {t('settings.logout_all_devices')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              logoutAllModalRef.current?.showModal();
                            }}
                            className={`btn ${buttonClicked ? 'btn-disabled' : 'btn-warning'}`}
                          >
                            {buttonClicked ? t('settings.please_wait') : t('settings.logout_all')}
                          </button>
                        </div>
                      </CollapseMenu>
                      <CollapseMenu id={'dangerSetting'} text={t('settings.dangerous')}>
                        <div className="w-full flex flex-col items-center">
                          <Divider />
                          <div className="font-normal text-xl py-3 flex items-center gap-2">
                            <MdDeleteSweep size={24} />
                            {t('settings.clear_notifications')}
                          </div>
                          <div className="font-thin px-4 py-2 break-keep">
                            {t('settings.clear_notifications_warning')}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              deleteAllNotificationsModalRef.current?.showModal();
                            }}
                            className={`btn ${buttonClicked ? 'btn-disabled' : 'btn-warning'}`}
                          >
                            {buttonClicked ? t('settings.please_wait') : t('settings.clear_notifications_btn')}
                          </button>
                          <Divider />
                          <div className="font-normal text-xl py-3 flex items-center gap-2">
                            <MdDeleteSweep size={24} />
                            {t('settings.clear_questions')}
                          </div>
                          <div className="font-thin px-4 py-2 break-keep">
                            {t('settings.clear_questions_warning')}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              deleteAllQuestionsModalRef.current?.showModal();
                            }}
                            className={`btn ${buttonClicked ? 'btn-disabled' : 'btn-warning'}`}
                          >
                            {buttonClicked ? t('settings.please_wait') : t('settings.clear_questions_btn')}
                          </button>
                          <Divider />
                          <div className="font-normal text-xl py-3 flex items-center gap-2">
                            <FaUserLargeSlash />
                            {t('settings.import_blocks_text')}
                          </div>
                          <div className="font-thin px-4 py-2 break-keep">
                            {t('settings.import_blocks_description')}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              importBlockModalRef.current?.showModal();
                            }}
                            className={`btn ${buttonClicked ? 'btn-disabled' : 'btn-warning'}`}
                          >
                            {buttonClicked ? t('settings.please_wait') : t('settings.import_blocks_btn')}
                          </button>
                          <Divider />
                          <div className="font-normal text-xl py-3 flex items-center gap-2">
                            <MdOutlineCleaningServices />
                            {t('settings.clean_account')}
                          </div>
                          <div className="font-thin px-4 py-2 break-keep">
                            {t('settings.clean_account_warning')}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              accountCleanModalRef.current?.showModal();
                            }}
                            className={`btn ${buttonClicked ? 'btn-disabled' : 'btn-error'}`}
                          >
                            {buttonClicked ? t('settings.please_wait') : t('settings.clean_account_btn')}
                          </button>

                          <Divider />
                          <div className="font-normal text-xl py-3 flex items-center gap-2">
                            <MdDeleteForever size={24} />
                            {t('settings.delete_account')}
                          </div>
                          <div className="font-thin px-4 py-2 break-keep">
                            {t('settings.delete_account_description')}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              accountDeleteModalRef.current?.showModal();
                            }}
                            className={`btn ${buttonClicked ? 'btn-disabled' : 'btn-error'}`}
                          >
                            {buttonClicked ? t('settings.please_wait') : t('settings.delete_account_btn')}
                          </button>
                        </div>
                      </CollapseMenu>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
          <DialogModalTwoButton
            title={t('modal.warning')}
            body={t('modal.confirm_logout_all')}
            confirmButtonText={t('modal.yes')}
            cancelButtonText={t('modal.no')}
            ref={logoutAllModalRef}
            onClick={onLogoutAll}
          />
          <DialogModalTwoButton
            title={t('modal.clear_notifications.title')}
            body={t('modal.clear_notifications.body')}
            confirmButtonText={t('modal.clear_notifications.confirm')}
            cancelButtonText={t('modal.clear_notifications.cancel')}
            ref={deleteAllNotificationsModalRef}
            onClick={onDeleteAllNotifications}
          />
          <DialogModalTwoButton
            title={t('modal.clear_questions.title')}
            body={t('modal.clear_questions.body')}
            confirmButtonText={t('modal.clear_questions.confirm')}
            cancelButtonText={t('modal.clear_questions.cancel')}
            ref={deleteAllQuestionsModalRef}
            onClick={onDeleteAllQuestions}
          />
          <DialogModalTwoButton
            title={t('modal.import_blocks.title')}
            body={t('modal.import_blocks.body', { instance: userInfo.instanceType })}
            confirmButtonText={t('modal.import_blocks.confirm')}
            cancelButtonText={t('modal.import_blocks.cancel')}
            ref={importBlockModalRef}
            onClick={onImportBlock}
          />
          <DialogModalTwoButton
            title={t('modal.clean_account.title')}
            body={t('modal.clean_account.body')}
            confirmButtonText={t('modal.clean_account.confirm')}
            cancelButtonText={t('modal.clean_account.cancel')}
            ref={accountCleanModalRef}
            onClick={onAccountClean}
          />
          <DialogModalTwoButton
            title={t('modal.delete_account.title')}
            body={t('modal.delete_account.body')}
            confirmButtonText={t('modal.delete_account.confirm')}
            cancelButtonText={t('modal.delete_account.cancel')}
            ref={accountDeleteModalRef}
            onClick={onAccountDelete}
          />
        </>
      )}
    </div>
  );
}