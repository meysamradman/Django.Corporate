"use client";

import { getUploadSettings, clearCache, getUploadConfig, useUploadSettings } from './config';
import { 
    getFileCategory,
    getImageAcceptTypes,
    validateFileSize,
    validateFileType,
    formatBytes,
    validateFileAdvanced
} from './validation';
import {
    GetImageUrl,
    GetVideoUrl,
    GetMediaUrlFromObject,
    GetMediaAltText,
    GetMediaCoverUrl,
    GetUserProfileImageUrl
} from './urlBuilder';

export const mediaService = {
    // Upload Settings
    getUploadSettings,
    clearCache,
    getUploadConfig,
    
    // Validation
    getImageAcceptTypes,
    validateFileSize,
    validateFileType,
    getFileCategory,
    formatBytes,
    validateFileAdvanced,
    
    // URL Construction - فقط پر استفاده‌ترین‌ها
    getImageUrl: GetImageUrl,
    getVideoUrl: GetVideoUrl,
    getMediaUrlFromObject: GetMediaUrlFromObject,
    getMediaAltText: GetMediaAltText,
    getMediaCoverUrl: GetMediaCoverUrl,
    getUserProfileImageUrl: GetUserProfileImageUrl,
    
    // Configuration  
    config: getUploadConfig()
};

// Named exports for direct use
export {
    getUploadSettings,
    useUploadSettings,
    getFileCategory,
    validateFileAdvanced,
    formatBytes
};