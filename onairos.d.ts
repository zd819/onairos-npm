declare module 'onairos' {
    export interface OnairosProps {
      requestData: any; // Consider using a more specific type or interface for request data.
      webpageName: string;
      inferenceData?: any;
      onComplete?: (data: any, error?: Error) => void; // Specify more precise types if possible.
      autoFetch?: boolean; // Default: true - automatically makes API calls after data approval
      proofMode?: boolean;
      textLayout?: 'right' | 'left' | 'below' | 'none';
      textColor?: 'black' | 'white';
      login?: boolean,
      loginReturn?:(data: any, error?: Error) => void;
      loginType?: string;
      visualType?: string;
      buttonType?: 'pill' | 'icon';
    }
    
  
    /**
     * Creates an Onairos component with various configuration options for fetching and displaying user data.
     */
    export function Onairos(props: OnairosProps): JSX.Element;

    export interface PopupHandlerOptions {
      autoFetch?: boolean;
      onApiResponse?: (response: any) => void;
    }

    // Popup handler functions
    export function openDataRequestPopup(data?: any): Window | null;
    export function closeDataRequestPopup(windowRef: Window): void;
    export function sendDataToPopup(windowRef: Window, data: any): Promise<void>;
    export function listenForPopupMessages(
      callback: (data: any) => void, 
      options?: PopupHandlerOptions
    ): () => void;

    export function OnairosButton(props: OnairosProps): JSX.Element;
    export default OnairosButton;
}
  