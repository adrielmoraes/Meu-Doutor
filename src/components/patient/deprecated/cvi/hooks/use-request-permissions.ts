export function useRequestPermissions() {
  return async () => {
    try {
      console.log('[useRequestPermissions] Requesting camera and microphone access...');
      
      // Check if mediaDevices is available (requires secure context - HTTPS)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Seu navegador não suporta acesso a câmera/microfone ou o site precisa estar em HTTPS.');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      console.log('[useRequestPermissions] Permissions granted successfully');
      
      // Stop all tracks after getting permissions
      stream.getTracks().forEach((track) => track.stop());
      
      return true;
    } catch (error: any) {
      // Log detailed error information
      const errorMessage = error?.message || 'Unknown error';
      const errorName = error?.name || 'Unknown';
      
      console.error('[useRequestPermissions] Failed to get permissions');
      console.error('[useRequestPermissions] Error name:', errorName);
      console.error('[useRequestPermissions] Error message:', errorMessage);
      console.error('[useRequestPermissions] Full error:', error);
      
      // Provide user-friendly error messages based on error type
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        throw new Error('Permissão de câmera e microfone negada. Por favor, permita o acesso e tente novamente.');
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        throw new Error('Câmera ou microfone não encontrados. Verifique se seus dispositivos estão conectados.');
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        throw new Error('Não foi possível acessar câmera/microfone. Verifique se outro aplicativo está usando.');
      } else if (errorName === 'OverconstrainedError' || errorName === 'ConstraintNotSatisfiedError') {
        throw new Error('Configuração de mídia não suportada pelo seu dispositivo.');
      } else if (errorName === 'SecurityError') {
        throw new Error('Acesso bloqueado por motivos de segurança. Certifique-se de estar usando HTTPS.');
      } else {
        throw new Error(`Erro ao acessar câmera/microfone: ${errorMessage}`);
      }
    }
  };
}
