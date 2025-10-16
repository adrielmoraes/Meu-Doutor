
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useDaily, DailyVideo, useDevices, useLocalSessionId } from '@daily-co/daily-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Mic, Video as VideoIcon, Check } from 'lucide-react';

interface HaircheckProps {
    onJoinCall: () => void;
}

export function Haircheck({ onJoinCall }: HaircheckProps) {
    const daily = useDaily();
    const localSessionId = useLocalSessionId();
    const { microphones, cameras, setMicrophone, setCamera } = useDevices();
    
    const [selectedMic, setSelectedMic] = useState<string>('');
    const [selectedCamera, setSelectedCamera] = useState<string>('');
    const [isReady, setIsReady] = useState(false);

    // Inicializar dispositivos padrão
    useEffect(() => {
        if (microphones.length > 0 && !selectedMic) {
            const defaultMic = microphones.find(m => m.selected) || microphones[0];
            setSelectedMic(defaultMic.device.deviceId);
        }
        if (cameras.length > 0 && !selectedCamera) {
            const defaultCam = cameras.find(c => c.selected) || cameras[0];
            setSelectedCamera(defaultCam.device.deviceId);
        }
    }, [microphones, cameras, selectedMic, selectedCamera]);

    // Iniciar preview quando dispositivos estiverem prontos
    useEffect(() => {
        if (daily && selectedMic && selectedCamera && !isReady) {
            daily.startCamera({
                audioSource: selectedMic,
                videoSource: selectedCamera
            }).then(() => setIsReady(true));
        }
    }, [daily, selectedMic, selectedCamera, isReady]);

    const handleMicChange = useCallback((deviceId: string) => {
        setSelectedMic(deviceId);
        setMicrophone(deviceId);
    }, [setMicrophone]);

    const handleCameraChange = useCallback((deviceId: string) => {
        setSelectedCamera(deviceId);
        setCamera(deviceId);
    }, [setCamera]);

    return (
        <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-950 dark:to-teal-950">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
                <h2 className="text-2xl font-bold mb-6 text-center">
                    Configurar Câmera e Microfone
                </h2>

                {/* Preview de vídeo */}
                <div className="relative mb-6 bg-black rounded-lg overflow-hidden aspect-video">
                    {isReady && localSessionId ? (
                        <DailyVideo
                            sessionId={localSessionId}
                            type="video"
                            className="w-full h-full object-cover mirror"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                </div>

                {/* Seleção de dispositivos */}
                <div className="space-y-4 mb-6">
                    <div>
                        <Label htmlFor="microphone" className="flex items-center gap-2 mb-2">
                            <Mic className="h-4 w-4" />
                            Microfone
                        </Label>
                        <Select value={selectedMic} onValueChange={handleMicChange}>
                            <SelectTrigger id="microphone">
                                <SelectValue placeholder="Selecione um microfone" />
                            </SelectTrigger>
                            <SelectContent>
                                {microphones.map((mic) => (
                                    <SelectItem key={mic.device.deviceId} value={mic.device.deviceId}>
                                        {mic.device.label || `Microfone ${mic.device.deviceId.slice(0, 5)}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="camera" className="flex items-center gap-2 mb-2">
                            <VideoIcon className="h-4 w-4" />
                            Câmera
                        </Label>
                        <Select value={selectedCamera} onValueChange={handleCameraChange}>
                            <SelectTrigger id="camera">
                                <SelectValue placeholder="Selecione uma câmera" />
                            </SelectTrigger>
                            <SelectContent>
                                {cameras.map((cam) => (
                                    <SelectItem key={cam.device.deviceId} value={cam.device.deviceId}>
                                        {cam.device.label || `Câmera ${cam.device.deviceId.slice(0, 5)}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Botão de entrar */}
                <Button
                    onClick={onJoinCall}
                    disabled={!isReady}
                    className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                    size="lg"
                >
                    <Check className="mr-2 h-5 w-5" />
                    Entrar na Consulta
                </Button>
            </div>
        </div>
    );
}
