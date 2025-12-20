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

    /**
     * Data returned when reconnection is complete
     */
    export interface OnairosReconnectCompleteData {
      connectedAccounts: string[];          // Array of connected platform names
      userData: any;                        // Updated user data object
      timestamp: string;                    // ISO timestamp of the reconnection
    }

    /**
     * Props for the OnairosReconnectButton component
     */
    export interface OnairosReconnectButtonProps {
      buttonText?: string;                  // Text to display on the button (default: "Reconnect Data Sources")
      buttonClass?: string;                 // Custom CSS classes for the button
      buttonStyle?: React.CSSProperties;    // Custom inline styles for the button
      appIcon?: string;                     // Icon URL for the app (optional)
      appName?: string;                     // Name of the app (default: "Your App")
      onComplete?: (data: OnairosReconnectCompleteData) => void; // Callback when connection changes are complete
      onNoUserData?: () => void;            // Callback when no user data is found
      priorityPlatform?: string;            // Platform to prioritize (e.g., 'gmail', 'pinterest', 'linkedin')
      rawMemoriesOnly?: boolean;            // Show only LLM connections when true (default: false)
      rawMemoriesConfig?: any;              // Configuration for RAW memories collection
    }

    /**
     * OnairosReconnectButton - A button that allows users to reconnect or change their data sources
     * 
     * This button checks if user Onairos data is stored and opens the data connection page
     * to allow users to modify their connected accounts/data sources.
     * 
     * @example
     * ```tsx
     * import { OnairosReconnectButton } from 'onairos';
     * 
     * function MyComponent() {
     *   return (
     *     <OnairosReconnectButton 
     *       buttonText="Manage Data Sources"
     *       appName="My App"
     *       onComplete={(result) => {
     *         console.log('Updated connections:', result.connectedAccounts);
     *       }}
     *       onNoUserData={() => {
     *         console.log('No user data found');
     *       }}
     *     />
     *   );
     * }
     * ```
     */
    export function OnairosReconnectButton(props: OnairosReconnectButtonProps): JSX.Element;

    // ===============================================
    // Platform Disconnect & Destruct API
    // ===============================================

    /**
     * Response from disconnectPlatform
     */
    export interface DisconnectPlatformResponse {
      success: boolean;
      platform: string;
      message: string;
      error?: string;
      data?: any;
    }

    /**
     * Response from disconnectMultiplePlatforms
     */
    export interface DisconnectMultiplePlatformsResponse {
      successful: string[];
      failed: Array<{ platform: string; error: string }>;
      total: number;
    }

    /**
     * Response from destructWrappedData
     */
    export interface DestructWrappedDataResponse {
      success: boolean;
      message: string;
      error?: string;
      details?: {
        wrappedDashboardCleared?: boolean;
        wrappedTraitsCleared?: boolean;
        pendingJobsDeleted?: number;
        userNumberReset?: boolean;
        wrappedUserNumber?: number;
        wrappedFirstUsedAt?: string;
      };
      data?: any;
    }

    /**
     * Disconnect a platform from user's account
     * Removes OAuth tokens and platform data
     * 
     * @param platform - Platform name (e.g., 'youtube', 'reddit', 'gmail')
     * @param username - User's email or username
     * @returns Promise resolving to disconnect response
     * 
     * @example
     * ```typescript
     * import { disconnectPlatform } from 'onairos';
     * 
     * const result = await disconnectPlatform('youtube', 'user@example.com');
     * if (result.success) {
     *   console.log('YouTube disconnected successfully');
     * }
     * ```
     */
    export function disconnectPlatform(
      platform: string,
      username: string
    ): Promise<DisconnectPlatformResponse>;

    /**
     * Disconnect multiple platforms at once
     * 
     * @param platforms - Array of platform names
     * @param username - User's email or username
     * @returns Promise resolving to results for all platforms
     * 
     * @example
     * ```typescript
     * import { disconnectMultiplePlatforms } from 'onairos';
     * 
     * const result = await disconnectMultiplePlatforms(
     *   ['youtube', 'reddit', 'linkedin'],
     *   'user@example.com'
     * );
     * console.log(`Disconnected ${result.successful.length} platforms`);
     * ```
     */
    export function disconnectMultiplePlatforms(
      platforms: string[],
      username: string
    ): Promise<DisconnectMultiplePlatformsResponse>;

    /**
     * Permanently delete all Wrapped dashboard data for the authenticated user
     * Requires authentication token in localStorage
     * 
     * @param resetNumber - Whether to also reset wrappedUserNumber (admin only, default: false)
     * @returns Promise resolving to destruct response
     * 
     * @example
     * ```typescript
     * import { destructWrappedData } from 'onairos';
     * 
     * const result = await destructWrappedData();
     * if (result.success) {
     *   console.log('Wrapped data deleted:', result.details);
     * }
     * ```
     */
    export function destructWrappedData(
      resetNumber?: boolean
    ): Promise<DestructWrappedDataResponse>;

    /**
     * Update localStorage after disconnecting a platform
     * Removes the platform from connectedAccounts array
     * 
     * @param platform - Platform name that was disconnected
     */
    export function updateLocalStorageAfterDisconnect(platform: string): void;

    /**
     * Update localStorage after deleting wrapped data
     * Clears wrapped-related fields from userData
     */
    export function updateLocalStorageAfterDestruct(): void;

    /**
     * Check if user has authentication token
     * @returns True if token exists in localStorage
     */
    export function hasAuthToken(): boolean;

    /**
     * Get list of all supported platforms for disconnection
     * @returns Array of platform names
     */
    export function getSupportedPlatforms(): string[];

    /**
     * Check if a platform is supported for disconnection
     * @param platform - Platform name
     * @returns True if platform is supported
     */
    export function isPlatformSupported(platform: string): boolean;
}
  