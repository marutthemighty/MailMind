import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { Mic, MicOff, Volume2 } from "lucide-react";

interface VoiceInputProps {
  isOpen: boolean;
  onClose: () => void;
  onTranscript: (text: string) => void;
}

export function VoiceInput({ isOpen, onClose, onTranscript }: VoiceInputProps) {
  const { 
    isListening, 
    transcript, 
    error, 
    isSupported, 
    startListening, 
    stopListening, 
    clearTranscript 
  } = useVoiceRecognition();
  
  const [finalTranscript, setFinalTranscript] = useState("");

  const handleStart = () => {
    clearTranscript();
    setFinalTranscript("");
    startListening();
  };

  const handleStop = () => {
    stopListening();
    if (transcript) {
      setFinalTranscript(transcript);
    }
  };

  const handleInsert = () => {
    if (finalTranscript) {
      onTranscript(finalTranscript);
    }
    onClose();
  };

  const handleCancel = () => {
    stopListening();
    clearTranscript();
    setFinalTranscript("");
    onClose();
  };

  useEffect(() => {
    if (!isListening && transcript && transcript !== finalTranscript) {
      setFinalTranscript(transcript);
    }
  }, [isListening, transcript, finalTranscript]);

  if (!isSupported) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Voice Input Not Available</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Voice recognition is not supported in your browser. Please try using Chrome, Edge, or Safari.
            </p>
            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" data-testid="voice-input-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Volume2 className="w-5 h-5" />
            <span>Voice to Text</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Recording Status */}
          <div className="text-center">
            <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mx-auto mb-4 transition-colors ${
              isListening 
                ? 'border-red-500 bg-red-50 animate-pulse' 
                : 'border-gray-300 bg-gray-50'
            }`}>
              {isListening ? (
                <Mic className="w-8 h-8 text-red-500" />
              ) : (
                <MicOff className="w-8 h-8 text-gray-400" />
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {isListening 
                ? "Listening... Speak clearly into your microphone" 
                : "Click the microphone to start recording"
              }
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Transcript Display */}
          <div className="bg-muted rounded-lg p-4 min-h-24">
            <p className="text-sm font-medium text-foreground mb-2">Transcript:</p>
            <div className="text-sm text-muted-foreground">
              {transcript || finalTranscript || "Your speech will appear here..."}
              {isListening && <span className="animate-pulse">|</span>}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center space-x-3">
            {!isListening ? (
              <Button 
                onClick={handleStart}
                className="flex items-center space-x-2"
                data-testid="button-start-recording"
              >
                <Mic className="w-4 h-4" />
                <span>Start Recording</span>
              </Button>
            ) : (
              <Button 
                onClick={handleStop}
                variant="destructive"
                className="flex items-center space-x-2"
                data-testid="button-stop-recording"
              >
                <MicOff className="w-4 h-4" />
                <span>Stop Recording</span>
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          {(finalTranscript || (!isListening && transcript)) && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={handleCancel}
                data-testid="button-cancel-voice"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleInsert}
                data-testid="button-insert-text"
              >
                Insert Text
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
