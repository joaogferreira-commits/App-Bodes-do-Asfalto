import i18n from '@/i18n';

beforeAll(async () => {
  await i18n.changeLanguage('pt-BR');
});

jest.mock(
  'react-native-safe-area-context',
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-safe-area-context/jest/mock').default,
);

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file:///foto-original.jpg' }],
  })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true })),
}));

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      resize: jest.fn(),
      renderAsync: jest.fn(async () => ({
        saveAsync: jest.fn(async () => ({ uri: 'file:///foto-sem-exif.jpg' })),
      })),
    })),
  },
}));

jest.mock('expo-camera', () => {
  const { createElement, forwardRef, useImperativeHandle } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const CameraView = forwardRef((p: object, ref: unknown) => {
    useImperativeHandle(ref, () => ({
      takePictureAsync: jest.fn(async () => ({ uri: 'file:///camera.jpg' })),
      recordAsync: jest.fn(async () => ({ uri: 'file:///video.mp4' })),
      stopRecording: jest.fn(),
    }));
    return createElement(View, { testID: 'camera', ...p });
  });
  return {
    CameraView,
    useCameraPermissions: () => [{ granted: true }, jest.fn(async () => ({ granted: true }))],
    useMicrophonePermissions: () => [{ granted: true }, jest.fn(async () => ({ granted: true }))],
  };
});
jest.mock('expo-video', () => {
  const { createElement } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return { useVideoPlayer: () => ({ play: jest.fn() }), VideoView: (p: object) => createElement(View, p) };
});
