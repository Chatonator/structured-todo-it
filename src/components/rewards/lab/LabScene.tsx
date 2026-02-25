import React, { useRef } from 'react';
import { useLabScene } from './useLabScene';
import { Button } from '@/components/ui/button';
import { FlaskConical } from 'lucide-react';

const LabScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { phase, refine } = useLabScene(canvasRef);

  const canRefine = phase === 'idle';
  const isRefining = phase === 'refining';

  return (
    <div className="relative w-full h-[600px] md:h-[700px] rounded-lg overflow-hidden select-none">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Refine button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <Button
          onClick={refine}
          disabled={!canRefine}
          size="lg"
          className="gap-2 text-base font-semibold px-8 py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white shadow-lg shadow-amber-900/30"
        >
          <FlaskConical className="w-5 h-5" />
          {isRefining ? 'Transfert en cours…' : phase === 'done' ? 'Raffinement terminé' : 'Raffiner'}
        </Button>
      </div>

      {/* Phase indicator */}
      {phase === 'initializing' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs text-white/40 z-10">
          Stabilisation des billes…
        </div>
      )}
    </div>
  );
};

export default LabScene;
