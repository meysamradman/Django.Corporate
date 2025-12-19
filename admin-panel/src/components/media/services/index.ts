import { getUploadSettings, getUploadConfig, useUploadSettings } from './config';
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
    getUploadSettings,
    getUploadConfig,
    
    getImageAcceptTypes,
    validateFileSize,
    validateFileType,
    getFileCategory,
    formatBytes,
    validateFileAdvanced,
    
    getImageUrl: GetImageUrl,
    getVideoUrl: GetVideoUrl,
    getMediaUrlFromObject: GetMediaUrlFromObject,
    getMediaAltText: GetMediaAltText,
    getMediaCoverUrl: GetMediaCoverUrl,
    getUserProfileImageUrl: GetUserProfileImageUrl,
    
    config: getUploadConfig()
};

export {
    getUploadSettings,
    useUploadSettings,
    getFileCategory,
    validateFileAdvanced,
    formatBytes
};