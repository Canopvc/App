import { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';

export default function useSteps(target = 10000) {
  const [steps, setSteps] = useState(0);
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Função para pausar/retomar simulação
  const toggleSimulation = () => {
    setIsSimulationPaused(prev => !prev);
  };

  // Função para resetar passos
  const resetSteps = () => {
    setSteps(0);
  };

  // Função para iniciar simulação
  const startSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    
    simulationIntervalRef.current = setInterval(() => {
      setSteps(prev => {
        const newSteps = prev + Math.floor(Math.random() * 10) + 1;
        return newSteps > target ? target : newSteps;
      });
    }, 3000);
  };

  // Função para parar simulação
  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  };

  // Efeito para controlar a simulação
  useEffect(() => {
    if (isSimulationPaused) {
      stopSimulation();
    } else {
      startSimulation();
    }

    return () => {
      stopSimulation();
    };
  }, [isSimulationPaused, target]);

  return { 
    available: false, // Sempre false em desenvolvimento
    steps, 
    target, 
    error: 'Using simulation mode for development', 
    isSimulated: true, // Sempre true em desenvolvimento
    isSimulationPaused,
    toggleSimulation,
    resetSteps
  };
}