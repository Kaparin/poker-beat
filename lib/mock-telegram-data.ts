// lib/mock-telegram-data.ts
export const mockTelegramInitData = {
  query_id: "AAHdF6IQAAAAAN0XohDNEIxY",
  user: {
    id: 123456789,
    first_name: "Test",
    last_name: "User",
    username: "testuser",
    language_code: "en",
    allows_write_to_pm: true,
  },
  auth_date: Math.floor(Date.now() / 1000),
  hash: "mock_hash_for_testing",
}

export function injectMockTelegramData() {
  if (typeof window !== "undefined") {
    // @ts-ignore
    window.Telegram = {
      WebApp: {
        initData: new URLSearchParams(
          Object.entries({
            user: JSON.stringify(mockTelegramInitData.user),
            auth_date: mockTelegramInitData.auth_date.toString(),
            hash: mockTelegramInitData.hash,
            query_id: mockTelegramInitData.query_id,
          }),
        ).toString(),
        initDataUnsafe: mockTelegramInitData,
        ready: () => {},
        expand: () => {},
        close: () => {},
        MainButton: {
          text: "",
          color: "#2481cc",
          textColor: "#ffffff",
          isVisible: false,
          isActive: true,
          isProgressVisible: false,
          onClick: (callback: Function) => {},
          offClick: (callback: Function) => {},
          show: () => {},
          hide: () => {},
          enable: () => {},
          disable: () => {},
          showProgress: (leaveActive = false) => {},
          hideProgress: () => {},
          setText: (text: string) => {},
          setParams: (params: {
            text?: string
            color?: string
            textColor?: string
            is_active?: boolean
            is_visible?: boolean
          }) => {},
        },
        BackButton: {
          isVisible: false,
          onClick: (callback: Function) => {},
          offClick: (callback: Function) => {},
          show: () => {},
          hide: () => {},
        },
        HapticFeedback: {
          impactOccurred: (style: string) => {},
          notificationOccurred: (type: string) => {},
          selectionChanged: () => {},
        },
        isExpanded: true,
        viewportHeight: window.innerHeight,
        viewportStableHeight: window.innerHeight,
        headerColor: "#ffffff",
        backgroundColor: "#ffffff",
        isClosingConfirmationEnabled: false,
        enableClosingConfirmation: () => {},
        disableClosingConfirmation: () => {},
        onEvent: (eventType: string, eventHandler: Function) => {},
        offEvent: (eventType: string, eventHandler: Function) => {},
        sendData: (data: any) => {},
        openLink: (url: string) => {
          window.open(url, "_blank")
        },
        openTelegramLink: (url: string) => {
          window.open(`https://t.me/${url}`, "_blank")
        },
        openInvoice: (url: string) => {},
        showPopup: (params: any, callback: Function) => {},
        showAlert: (message: string, callback: Function) => {
          alert(message)
          if (callback) callback()
        },
        showConfirm: (message: string, callback: Function) => {
          const result = confirm(message)
          if (callback) callback(result)
        },
        showScanQrPopup: (params: any, callback: Function) => {},
        closeScanQrPopup: () => {},
        readTextFromClipboard: (callback: Function) => {
          callback("")
        },
        requestWriteAccess: (callback: Function) => {
          callback(true)
        },
        requestContact: (callback: Function) => {
          callback(false)
        },
        invokeCustomMethod: (method: string, params: any, callback: Function) => {},
        version: "6.0",
        colorScheme: "light",
        themeParams: {
          bg_color: "#ffffff",
          text_color: "#000000",
          hint_color: "#999999",
          link_color: "#2481cc",
          button_color: "#2481cc",
          button_text_color: "#ffffff",
        },
        isVersionAtLeast: (version: string) => true,
        setHeaderColor: (color: string) => {},
        setBackgroundColor: (color: string) => {},
        platform: "Web",
      },
    }
  }
}

