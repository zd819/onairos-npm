declare module 'onairos' {
    export interface OnairosProps {
      requestData: any; // Consider using a more specific type or interface for request data.
      webpageName: string;
      inferenceData?: any;
      onComplete?: (data: any, error?: Error) => void; // Specify more precise types if possible.
      autoFetch?: boolean;
      proofMode?: boolean;
      textLayout?: 'right' | 'left' | 'below' | 'none';
      textColor?: 'black' | 'white';
    }
    
  
    /**
     * Creates an Onairos component with various configuration options for fetching and displaying user data.
     */
    export function Onairos(props: OnairosProps): JSX.Element;
  }
  