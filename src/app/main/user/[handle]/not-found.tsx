'use client';

import { useTranslation } from 'react-i18next';

export default function UserNotFoundPage() {
  const { t } = useTranslation();
  
  return (
    <div className="w-[90%] window:w-[80%] desktop:w-[70%] grid grid-cols-1 desktop:grid-cols-2 gap-4">
      <div className="w-full col-span-2 flex flex-col justify-center items-center glass text-4xl rounded-box shadow p-2">
        😶‍🌫️
        <span>{t('user.profile.notFound.message')}</span>
      </div>
    </div>
  );
}
