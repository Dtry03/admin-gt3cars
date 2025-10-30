import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {

  appId: 'com.gt3cars.admin', 
  appName: 'GT3CARS Admin',

  webDir: 'dist', 

  server: {
    androidScheme: 'https',

  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
    },
  },
};

export default config;
