import QRCode from 'qrcode';

export const generateQRCode = async (text: string, options: QRCode.QRCodeToDataURLOptions = {}) => {
  try {
    const defaultOptions: QRCode.QRCodeToDataURLOptions = {
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      ...options,
    };
    return await QRCode.toDataURL(text, defaultOptions);
  } catch (err) {
    console.error('QR Generation Error:', err);
    return null;
  }
};
