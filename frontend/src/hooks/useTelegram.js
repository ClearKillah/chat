import { useEffect, useState } from 'react';

const useTelegram = () => {
  const [telegramWebApp, setTelegramWebApp] = useState(null);
  
  useEffect(() => {
    // Access the Telegram WebApp API
    const tg = window.Telegram?.WebApp;
    
    if (tg) {
      setTelegramWebApp(tg);
      
      // Expand the app to full height
      tg.expand();
      
      // Enable closing confirmation
      tg.enableClosingConfirmation();
    }
  }, []);
  
  return {
    tg: telegramWebApp || {},
    user: telegramWebApp?.initDataUnsafe?.user,
    queryId: telegramWebApp?.initDataUnsafe?.query_id,
    onClose: telegramWebApp?.close,
    ready: telegramWebApp?.ready,
  };
};

export { useTelegram }; 