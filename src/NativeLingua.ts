import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  install(): string | undefined;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Lingua');
