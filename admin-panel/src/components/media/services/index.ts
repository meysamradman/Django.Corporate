"use client";

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

/**
 * 🎯 سرویس مرکزی مدیا - تمام فانکشنالیتی‌های مدیا در یک جا
 * 
 * مزایا:
 * ✅ یک منبع واحد برای تمام پاپ‌آپ‌ها
 * ✅ سرعت بالا - بدون API call
 * ✅ تمیز و حرفه‌ای
 */
export const mediaService = {
    // ⚙️ تنظیمات آپلود
    getUploadSettings,
    getUploadConfig,
    
    // ✅ Validation
    getImageAcceptTypes,
    validateFileSize,
    validateFileType,
    getFileCategory,
    formatBytes,
    validateFileAdvanced,
    
    // 🔗 URL Builders
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