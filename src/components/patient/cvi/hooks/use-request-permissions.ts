export function useRequestPermissions() {
  return async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      // Stop all tracks after getting permissions
      stream.getTracks().forEach((track) => track.stop());
      
      return true;
    } catch (error) {
      console.error('[useRequestPermissions] Failed to get permissions:', error);
      throw new Error('Permissão de câmera e microfone negada. Por favor, permita o acesso e tente novamente.');
    }
  };
}
