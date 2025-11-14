declare module 'onairos' {
    /**
     * Data returned when the Onairos flow completes successfully
     */
    export interface OnairosCompleteData {
      // Core response fields
      token: string;                    // JWT token for authenticated API calls
      apiUrl: string;                   // Backend API endpoint URL
      
      // Request metadata
      userHash?: string;                // Unique user identifier
      appName?: string;                 // Name of the requesting application
      approvedData?: string[];          // Array of approved data types (e.g., ['basic', 'personality'])
      testMode?: boolean;               // Whether running in test mode
      timestamp?: string;               // ISO timestamp of the request
      
      // API response data
      apiResponse?: any;                // Raw API response with personality/inference data
      authorizedData?: any;             // Data that was authorized for sharing
      usage?: any;                      // API usage information
      
      // User data
      userData?: any;                   // Complete user profile and session data
      
      // Enhanced formatting (added by logFormattedUserData)
      userDataSummary?: {               // Structured summary of user data
        requestInfo?: any;
        userProfile?: any;
        connectedAccounts?: any;
        aiData?: any;
        status?: any;
      };
      prettyPrint?: string;             // Pretty-printed version for console logging
      
      // Status indicators
      success?: boolean;                // Whether the request was successful
      simulated?: boolean;              // Whether data is simulated (test mode)
      error?: string;                   // Error message if request failed
      cancelled?: boolean;              // Whether user cancelled the flow
      
      [key: string]: any;               // Allow additional properties
    }

    export interface OnairosProps {
      requestData: any; // Consider using a more specific type or interface for request data.
      webpageName: string;
      inferenceData?: any;
      onComplete?: (data: OnairosCompleteData, error?: Error) => void;
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
  