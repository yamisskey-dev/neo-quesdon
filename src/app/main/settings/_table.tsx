'use client';

import CollapseMenu from '@/app/_components/collapseMenu';
import DialogModalLoadingOneButton from '@/app/_components/modalLoadingOneButton';
import DialogModalTwoButton from '@/app/_components/modalTwoButton';
import { Block, DeleteBlockByIdDto, GetBlockListReqDto, GetBlockListResDto } from '@/app/_dto/blocking/blocking.dto';
import { onApiError } from '@/utils/api-error/onApiError';
import { BlockEv } from '@/app/main/_events';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function BlockList() {
  const { t } = useTranslation();
  const [untilId, setUntilId] = useState<string | null>(null);
  const [blockList, setBlockList] = useState<Block[]>([]);
  const [unblockId, setUnblockId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mounted, setMounted] = useState<HTMLTableRowElement | null>(null);
  const [loadingDoneModalText, setLoadingDoneModalText] = useState<{ title: string; body: string }>({
    title: t('modal.unblock.done.title'),
    body: t('modal.unblock.done.body'),
  });
  const unblockConfirmModalRef = useRef<HTMLDialogElement>(null);
  const unblockSuccessModalRef = useRef<HTMLDialogElement>(null);

  const doUnBlock = async (id: string) => {
    setIsLoading(true);
    unblockSuccessModalRef.current?.showModal();
    const data: DeleteBlockByIdDto = { targetId: id };
    const res = await fetch('/api/user/blocking/delete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      setIsLoading(false);
      setLoadingDoneModalText({
        title: t('modal.unblock.error.title'),
        body: t('modal.unblock.error.body', {message: await res.text()}),
      });
      return;
    }
    setBlockList((prevList) => (prevList ? [...prevList.filter((prev) => prev.id !== id)] : []));
    setIsLoading(false);
    BlockEv.sendBlockUpdatedEvent();
  };

  const fetchBlocklist = async (req: GetBlockListReqDto): Promise<Block[]> => {
    const res = await fetch('/api/user/blocking/list', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    try {
      if (res.ok) {
        const blocklist = ((await res.json()) as GetBlockListResDto).blockList;
        return blocklist;
      } else {
        onApiError(res.status, res);
        throw new Error(t('error.failed_to_load_blocklist'));
      }
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          fetchBlocklist({ limit: 30, ...(untilId ? { untilId: untilId } : {}), sort: 'DESC' }).then((list) => {
            if (list.length === 0) {
              setIsLoading(false);
              return;
            }
            setBlockList((prevlist) => [...prevlist, ...list]);
            setUntilId(list[list.length - 1].id);
          });
        }
      },
      { threshold: 0.7 },
    );
    if (mounted) observer.observe(mounted);
    return () => {
      if (mounted) observer.unobserve(mounted);
    };
  }, [mounted, untilId]);

  return (
    <>
      <CollapseMenu id={'blockList'} text={t('settings.blocklist.view')}>
        <table className="table">
          <thead>
            <tr>
              <th className="text-sm dark:text-white">{t('settings.blocklist.user_handle')}</th>
            </tr>
          </thead>
          <tbody>
            {blockList.map((el) => (
              <tr key={el.id}>
                <td className="break-all">{el.targetHandle}</td>
                <td>
                  <button
                    className="btn btn-warning btn-sm w-full break-keep"
                    onClick={() => {
                      setUnblockId(el.id);
                      unblockConfirmModalRef.current?.showModal();
                    }}
                  >
                    {t('settings.blocklist.unblock')}
                  </button>
                </td>
              </tr>
            ))}
            <tr ref={(ref) => setMounted(ref)}>
              {isLoading ? (
                <td>
                  <span className="loading loading-spinner" />
                </td>
              ) : (
                <>
                  {blockList.length === 0 ? (
                    <td>
                      <span className="text-lg">{t('settings.blocklist.empty')}</span>
                    </td>
                  ) : (
                    <td>
                      <span className="text-lg">{t('settings.blocklist.end')}</span>
                    </td>
                  )}
                </>
              )}
            </tr>
          </tbody>
        </table>
      </CollapseMenu>
      <DialogModalTwoButton
        title={t('modal.unblock.confirm.title')}
        body={t('modal.unblock.confirm.body')}
        confirmButtonText={t('modal.unblock.confirm.yes')}
        onClick={() => doUnBlock(unblockId!)}
        cancelButtonText={t('modal.unblock.confirm.no')}
        ref={unblockConfirmModalRef}
      />
      <DialogModalLoadingOneButton
        isLoading={isLoading}
        title_loading={t('modal.unblock.loading.title')}
        title_done={loadingDoneModalText.title}
        body_loading={t('modal.unblock.loading.body')}
        body_done={loadingDoneModalText.body}
        loadingButtonText={t('common.loading')}
        doneButtonText={t('common.close')}
        ref={unblockSuccessModalRef}
      />
    </>
  );
}
