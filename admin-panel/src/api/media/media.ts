import { DEFAULT_MEDIA_PAGE_SIZE, VALID_MEDIA_PAGE_SIZES } from './constants';
import { getMediaList } from './list';
import { getMediaDetails } from './details';
import { uploadMedia } from './upload';
import { deleteMedia, updateMedia, updateCoverImage, bulkDeleteMedia } from './mutations';
import { getUploadSettings } from './settings';

export { DEFAULT_MEDIA_PAGE_SIZE, VALID_MEDIA_PAGE_SIZES };

export const mediaApi = {
    getMediaList,
    getMediaDetails,
    uploadMedia,
    deleteMedia,
    updateMedia,
    updateCoverImage,
    bulkDeleteMedia,
    getUploadSettings,
};
