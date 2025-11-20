http://localhost:8000/api/admin/permissions/map/

{
    "metaData": {
        "status": "success",
        "message": "Permission map retrieved successfully.",
        "AppStatusCode": 200,
        "timestamp": "2025-11-20T16:37:37.184151"
    },
    "data": {
        "all_permissions": {
            "permissions": {
                "dashboard.read": {
                    "id": "dashboard.read",
                    "module": "statistics",
                    "action": "read",
                    "display_name": "View Dashboard",
                    "description": "Access the admin dashboard (also in base permissions)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "panel.manage": {
                    "id": "panel.manage",
                    "module": "panel",
                    "action": "manage",
                    "display_name": "Manage Panel Settings",
                    "description": "Allow full access to panel settings (view, update, logo upload)",
                    "requires_superadmin": true,
                    "is_standalone": true
                },
                "pages.manage": {
                    "id": "pages.manage",
                    "module": "pages",
                    "action": "manage",
                    "display_name": "Manage Pages",
                    "description": "Allow full access to website pages (about, terms) - view and update",
                    "requires_superadmin": true,
                    "is_standalone": true
                },
                "media.read": {
                    "id": "media.read",
                    "module": "media",
                    "action": "read",
                    "display_name": "View Media Library",
                    "description": "View all media items (images, videos, audio, documents)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.image.upload": {
                    "id": "media.image.upload",
                    "module": "media",
                    "action": "create",
                    "display_name": "Upload Images",
                    "description": "Upload image files (jpg, png, webp, svg, gif)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.video.upload": {
                    "id": "media.video.upload",
                    "module": "media",
                    "action": "create",
                    "display_name": "Upload Videos",
                    "description": "Upload video files (mp4, webm, mov)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.audio.upload": {
                    "id": "media.audio.upload",
                    "module": "media",
                    "action": "create",
                    "display_name": "Upload Audio",
                    "description": "Upload audio files (mp3, ogg, aac, m4a)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.document.upload": {
                    "id": "media.document.upload",
                    "module": "media",
                    "action": "create",
                    "display_name": "Upload Documents",
                    "description": "Upload PDF and document files",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.upload": {
                    "id": "media.upload",
                    "module": "media",
                    "action": "create",
                    "display_name": "Upload All Media Types",
                    "description": "Upload any type of media file (images, videos, audio, documents)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.image.update": {
                    "id": "media.image.update",
                    "module": "media",
                    "action": "update",
                    "display_name": "Edit Images",
                    "description": "Edit image metadata (title, alt, description)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.video.update": {
                    "id": "media.video.update",
                    "module": "media",
                    "action": "update",
                    "display_name": "Edit Videos",
                    "description": "Edit video metadata and cover image",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.audio.update": {
                    "id": "media.audio.update",
                    "module": "media",
                    "action": "update",
                    "display_name": "Edit Audio",
                    "description": "Edit audio metadata and cover image",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.document.update": {
                    "id": "media.document.update",
                    "module": "media",
                    "action": "update",
                    "display_name": "Edit Documents",
                    "description": "Edit document metadata and cover image",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.update": {
                    "id": "media.update",
                    "module": "media",
                    "action": "update",
                    "display_name": "Edit All Media Types",
                    "description": "Edit metadata for any media type",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.image.delete": {
                    "id": "media.image.delete",
                    "module": "media",
                    "action": "delete",
                    "display_name": "Delete Images",
                    "description": "Delete image files (dangerous - may break content)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.video.delete": {
                    "id": "media.video.delete",
                    "module": "media",
                    "action": "delete",
                    "display_name": "Delete Videos",
                    "description": "Delete video files (dangerous - may break content)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.audio.delete": {
                    "id": "media.audio.delete",
                    "module": "media",
                    "action": "delete",
                    "display_name": "Delete Audio",
                    "description": "Delete audio files (dangerous - may break content)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.document.delete": {
                    "id": "media.document.delete",
                    "module": "media",
                    "action": "delete",
                    "display_name": "Delete Documents",
                    "description": "Delete document files (dangerous - may break content)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.delete": {
                    "id": "media.delete",
                    "module": "media",
                    "action": "delete",
                    "display_name": "Delete All Media Types",
                    "description": "Delete any media file (very dangerous - may break content)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "media.manage": {
                    "id": "media.manage",
                    "module": "media",
                    "action": "manage",
                    "display_name": "Manage Media Library",
                    "description": "Full access to media library (view, upload, update, delete all types)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "profile.read": {
                    "id": "profile.read",
                    "module": "admin",
                    "action": "read",
                    "display_name": "View Personal Profile",
                    "description": "View own admin profile (also in base permissions)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "profile.update": {
                    "id": "profile.update",
                    "module": "admin",
                    "action": "update",
                    "display_name": "Update Personal Profile",
                    "description": "Update own admin profile (also in base permissions)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "admin.read": {
                    "id": "admin.read",
                    "module": "admin",
                    "action": "read",
                    "display_name": "View Admins",
                    "description": "Allow viewing admin users list and details",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "admin.create": {
                    "id": "admin.create",
                    "module": "admin",
                    "action": "create",
                    "display_name": "Create Admin",
                    "description": "Allow creating new admin users",
                    "requires_superadmin": true,
                    "is_standalone": false
                },
                "admin.update": {
                    "id": "admin.update",
                    "module": "admin",
                    "action": "update",
                    "display_name": "Update Admin",
                    "description": "Allow updating admin user information and profiles",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "admin.delete": {
                    "id": "admin.delete",
                    "module": "admin",
                    "action": "delete",
                    "display_name": "Delete Admin",
                    "description": "Allow deleting admin users",
                    "requires_superadmin": true,
                    "is_standalone": false
                },
                "admin.manage": {
                    "id": "admin.manage",
                    "module": "admin",
                    "action": "manage",
                    "display_name": "Manage Admins",
                    "description": "Allow full access to admin management (view, create, update, delete)",
                    "requires_superadmin": true,
                    "is_standalone": false
                },
                "users.read": {
                    "id": "users.read",
                    "module": "users",
                    "action": "read",
                    "display_name": "View Users",
                    "description": "Allow viewing regular users list and details",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "users.create": {
                    "id": "users.create",
                    "module": "users",
                    "action": "create",
                    "display_name": "Create User",
                    "description": "Allow creating new regular users",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "users.update": {
                    "id": "users.update",
                    "module": "users",
                    "action": "update",
                    "display_name": "Update User",
                    "description": "Allow updating regular user information and profiles",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "users.delete": {
                    "id": "users.delete",
                    "module": "users",
                    "action": "delete",
                    "display_name": "Delete User",
                    "description": "Allow deleting regular users",
                    "requires_superadmin": true,
                    "is_standalone": false
                },
                "users.manage": {
                    "id": "users.manage",
                    "module": "users",
                    "action": "manage",
                    "display_name": "Manage Users",
                    "description": "Allow full access to user management (view, create, update, delete)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.read": {
                    "id": "blog.read",
                    "module": "blog",
                    "action": "read",
                    "display_name": "View Blogs",
                    "description": "Allow viewing blog posts list and details",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.create": {
                    "id": "blog.create",
                    "module": "blog",
                    "action": "create",
                    "display_name": "Create Blog",
                    "description": "Allow creating new blog posts",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.update": {
                    "id": "blog.update",
                    "module": "blog",
                    "action": "update",
                    "display_name": "Update Blog",
                    "description": "Allow updating blog posts",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.delete": {
                    "id": "blog.delete",
                    "module": "blog",
                    "action": "delete",
                    "display_name": "Delete Blog",
                    "description": "Allow deleting blog posts",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.manage": {
                    "id": "blog.manage",
                    "module": "blog",
                    "action": "manage",
                    "display_name": "Manage Blogs",
                    "description": "Allow full access to blog posts (view, create, update, delete)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.category.read": {
                    "id": "blog.category.read",
                    "module": "blog",
                    "action": "read",
                    "display_name": "View Blog Categories",
                    "description": "Allow viewing blog categories",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.category.create": {
                    "id": "blog.category.create",
                    "module": "blog",
                    "action": "create",
                    "display_name": "Create Blog Category",
                    "description": "Allow creating blog categories",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.category.update": {
                    "id": "blog.category.update",
                    "module": "blog",
                    "action": "update",
                    "display_name": "Update Blog Category",
                    "description": "Allow updating blog categories",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.category.delete": {
                    "id": "blog.category.delete",
                    "module": "blog",
                    "action": "delete",
                    "display_name": "Delete Blog Category",
                    "description": "Allow deleting blog categories",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.category.manage": {
                    "id": "blog.category.manage",
                    "module": "blog",
                    "action": "manage",
                    "display_name": "Manage Blog Categories",
                    "description": "Allow full access to blog categories (view, create, update, delete)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.tag.read": {
                    "id": "blog.tag.read",
                    "module": "blog",
                    "action": "read",
                    "display_name": "View Blog Tags",
                    "description": "Allow viewing blog tags",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.tag.create": {
                    "id": "blog.tag.create",
                    "module": "blog",
                    "action": "create",
                    "display_name": "Create Blog Tag",
                    "description": "Allow creating blog tags",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.tag.update": {
                    "id": "blog.tag.update",
                    "module": "blog",
                    "action": "update",
                    "display_name": "Update Blog Tag",
                    "description": "Allow updating blog tags",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.tag.delete": {
                    "id": "blog.tag.delete",
                    "module": "blog",
                    "action": "delete",
                    "display_name": "Delete Blog Tag",
                    "description": "Allow deleting blog tags",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "blog.tag.manage": {
                    "id": "blog.tag.manage",
                    "module": "blog",
                    "action": "manage",
                    "display_name": "Manage Blog Tags",
                    "description": "Allow full access to blog tags (view, create, update, delete)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.read": {
                    "id": "portfolio.read",
                    "module": "portfolio",
                    "action": "read",
                    "display_name": "View Portfolios",
                    "description": "Allow viewing portfolio items list and details",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.create": {
                    "id": "portfolio.create",
                    "module": "portfolio",
                    "action": "create",
                    "display_name": "Create Portfolio",
                    "description": "Allow creating new portfolio items",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.update": {
                    "id": "portfolio.update",
                    "module": "portfolio",
                    "action": "update",
                    "display_name": "Update Portfolio",
                    "description": "Allow updating portfolio items",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.delete": {
                    "id": "portfolio.delete",
                    "module": "portfolio",
                    "action": "delete",
                    "display_name": "Delete Portfolio",
                    "description": "Allow deleting portfolio items",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.manage": {
                    "id": "portfolio.manage",
                    "module": "portfolio",
                    "action": "manage",
                    "display_name": "Manage Portfolios",
                    "description": "Allow full access to portfolio items (view, create, update, delete)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.category.read": {
                    "id": "portfolio.category.read",
                    "module": "portfolio",
                    "action": "read",
                    "display_name": "View Portfolio Categories",
                    "description": "Allow viewing portfolio categories",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.category.create": {
                    "id": "portfolio.category.create",
                    "module": "portfolio",
                    "action": "create",
                    "display_name": "Create Portfolio Category",
                    "description": "Allow creating portfolio categories",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.category.update": {
                    "id": "portfolio.category.update",
                    "module": "portfolio",
                    "action": "update",
                    "display_name": "Update Portfolio Category",
                    "description": "Allow updating portfolio categories",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.category.delete": {
                    "id": "portfolio.category.delete",
                    "module": "portfolio",
                    "action": "delete",
                    "display_name": "Delete Portfolio Category",
                    "description": "Allow deleting portfolio categories",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.category.manage": {
                    "id": "portfolio.category.manage",
                    "module": "portfolio",
                    "action": "manage",
                    "display_name": "Manage Portfolio Categories",
                    "description": "Allow full access to portfolio categories (view, create, update, delete)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.tag.read": {
                    "id": "portfolio.tag.read",
                    "module": "portfolio",
                    "action": "read",
                    "display_name": "View Portfolio Tags",
                    "description": "Allow viewing portfolio tags",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.tag.create": {
                    "id": "portfolio.tag.create",
                    "module": "portfolio",
                    "action": "create",
                    "display_name": "Create Portfolio Tag",
                    "description": "Allow creating portfolio tags",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.tag.update": {
                    "id": "portfolio.tag.update",
                    "module": "portfolio",
                    "action": "update",
                    "display_name": "Update Portfolio Tag",
                    "description": "Allow updating portfolio tags",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.tag.delete": {
                    "id": "portfolio.tag.delete",
                    "module": "portfolio",
                    "action": "delete",
                    "display_name": "Delete Portfolio Tag",
                    "description": "Allow deleting portfolio tags",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.tag.manage": {
                    "id": "portfolio.tag.manage",
                    "module": "portfolio",
                    "action": "manage",
                    "display_name": "Manage Portfolio Tags",
                    "description": "Allow full access to portfolio tags (view, create, update, delete)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.option.read": {
                    "id": "portfolio.option.read",
                    "module": "portfolio",
                    "action": "read",
                    "display_name": "View Portfolio Options",
                    "description": "Allow viewing portfolio options",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.option.create": {
                    "id": "portfolio.option.create",
                    "module": "portfolio",
                    "action": "create",
                    "display_name": "Create Portfolio Option",
                    "description": "Allow creating portfolio options",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.option.update": {
                    "id": "portfolio.option.update",
                    "module": "portfolio",
                    "action": "update",
                    "display_name": "Update Portfolio Option",
                    "description": "Allow updating portfolio options",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.option.delete": {
                    "id": "portfolio.option.delete",
                    "module": "portfolio",
                    "action": "delete",
                    "display_name": "Delete Portfolio Option",
                    "description": "Allow deleting portfolio options",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "portfolio.option.manage": {
                    "id": "portfolio.option.manage",
                    "module": "portfolio",
                    "action": "manage",
                    "display_name": "Manage Portfolio Options",
                    "description": "Allow full access to portfolio options (view, create, update, delete)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "email.read": {
                    "id": "email.read",
                    "module": "email",
                    "action": "read",
                    "display_name": "View Email Messages",
                    "description": "Allow viewing email messages, inbox, and statistics",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "email.create": {
                    "id": "email.create",
                    "module": "email",
                    "action": "create",
                    "display_name": "Create Email Messages",
                    "description": "Allow creating, sending, and replying to email messages",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "email.update": {
                    "id": "email.update",
                    "module": "email",
                    "action": "update",
                    "display_name": "Update Email Messages",
                    "description": "Allow updating, marking as read, and saving drafts for email messages",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "email.delete": {
                    "id": "email.delete",
                    "module": "email",
                    "action": "delete",
                    "display_name": "Delete Email Messages",
                    "description": "Allow deleting email messages",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "email.manage": {
                    "id": "email.manage",
                    "module": "email",
                    "action": "manage",
                    "display_name": "Manage Email Messages",
                    "description": "Allow full access to email messages (view, create, update, delete)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "forms.manage": {
                    "id": "forms.manage",
                    "module": "forms",
                    "action": "manage",
                    "display_name": "Manage Forms",
                    "description": "Allow full access to contact form fields (view, create, update, delete)",
                    "requires_superadmin": true,
                    "is_standalone": true
                },
                "settings.manage": {
                    "id": "settings.manage",
                    "module": "settings",
                    "action": "manage",
                    "display_name": "Manage Settings",
                    "description": "Allow full access to website general settings (view and update)",
                    "requires_superadmin": true,
                    "is_standalone": true
                },
                "ai.manage": {
                    "id": "ai.manage",
                    "module": "ai",
                    "action": "manage",
                    "display_name": "Manage AI Settings",
                    "description": "Allow full access to all AI features (chat, content generation, image generation)",
                    "requires_superadmin": true,
                    "is_standalone": true
                },
                "ai.chat.manage": {
                    "id": "ai.chat.manage",
                    "module": "ai",
                    "action": "manage",
                    "display_name": "Manage AI Chat",
                    "description": "Allow full access to AI chat (view, use, update, delete)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "ai.content.manage": {
                    "id": "ai.content.manage",
                    "module": "ai",
                    "action": "manage",
                    "display_name": "Manage AI Content Generation",
                    "description": "Allow full access to AI content generation (view, generate, update, delete)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "ai.image.manage": {
                    "id": "ai.image.manage",
                    "module": "ai",
                    "action": "manage",
                    "display_name": "Manage AI Image Generation",
                    "description": "Allow full access to AI image generation (view, generate, update, delete)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "statistics.dashboard.read": {
                    "id": "statistics.dashboard.read",
                    "module": "statistics",
                    "action": "read",
                    "display_name": "View Dashboard Overview",
                    "description": "View basic dashboard statistics (safe, general info)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "statistics.users.read": {
                    "id": "statistics.users.read",
                    "module": "statistics",
                    "action": "read",
                    "display_name": "View Users Statistics",
                    "description": "View detailed user statistics (sensitive)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "statistics.admins.read": {
                    "id": "statistics.admins.read",
                    "module": "statistics",
                    "action": "read",
                    "display_name": "View Admins Statistics",
                    "description": "View admin user statistics (highly sensitive)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "statistics.content.read": {
                    "id": "statistics.content.read",
                    "module": "statistics",
                    "action": "read",
                    "display_name": "View Content Statistics",
                    "description": "View portfolio, blog, media statistics",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "statistics.financial.read": {
                    "id": "statistics.financial.read",
                    "module": "statistics",
                    "action": "read",
                    "display_name": "View Financial Statistics",
                    "description": "View revenue, sales, financial data (future-proof)",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "statistics.export": {
                    "id": "statistics.export",
                    "module": "statistics",
                    "action": "export",
                    "display_name": "Export Statistics",
                    "description": "Export statistics data to Excel/CSV",
                    "requires_superadmin": false,
                    "is_standalone": false
                },
                "statistics.manage": {
                    "id": "statistics.manage",
                    "module": "statistics",
                    "action": "manage",
                    "display_name": "Manage Statistics",
                    "description": "Full access to all statistics features (view, export)",
                    "requires_superadmin": false,
                    "is_standalone": false
                }
            },
            "modules": [
                "pages",
                "portfolio",
                "forms",
                "statistics",
                "panel",
                "admin",
                "users",
                "ai",
                "email",
                "settings",
                "media",
                "blog"
            ]
        },
        "user_permissions": [
            "dashboard.read",
            "panel.manage",
            "pages.manage",
            "media.read",
            "media.image.upload",
            "media.video.upload",
            "media.audio.upload",
            "media.document.upload",
            "media.upload",
            "media.image.update",
            "media.video.update",
            "media.audio.update",
            "media.document.update",
            "media.update",
            "media.image.delete",
            "media.video.delete",
            "media.audio.delete",
            "media.document.delete",
            "media.delete",
            "media.manage",
            "profile.read",
            "profile.update",
            "admin.read",
            "admin.create",
            "admin.update",
            "admin.delete",
            "admin.manage",
            "users.read",
            "users.create",
            "users.update",
            "users.delete",
            "users.manage",
            "blog.read",
            "blog.create",
            "blog.update",
            "blog.delete",
            "blog.manage",
            "blog.category.read",
            "blog.category.create",
            "blog.category.update",
            "blog.category.delete",
            "blog.category.manage",
            "blog.tag.read",
            "blog.tag.create",
            "blog.tag.update",
            "blog.tag.delete",
            "blog.tag.manage",
            "portfolio.read",
            "portfolio.create",
            "portfolio.update",
            "portfolio.delete",
            "portfolio.manage",
            "portfolio.category.read",
            "portfolio.category.create",
            "portfolio.category.update",
            "portfolio.category.delete",
            "portfolio.category.manage",
            "portfolio.tag.read",
            "portfolio.tag.create",
            "portfolio.tag.update",
            "portfolio.tag.delete",
            "portfolio.tag.manage",
            "portfolio.option.read",
            "portfolio.option.create",
            "portfolio.option.update",
            "portfolio.option.delete",
            "portfolio.option.manage",
            "email.read",
            "email.create",
            "email.update",
            "email.delete",
            "email.manage",
            "forms.manage",
            "settings.manage",
            "ai.manage",
            "ai.chat.manage",
            "ai.content.manage",
            "ai.image.manage",
            "statistics.dashboard.read",
            "statistics.users.read",
            "statistics.admins.read",
            "statistics.content.read",
            "statistics.financial.read",
            "statistics.export",
            "statistics.manage"
        ],
        "base_permissions": [
            "dashboard.read",
            "profile.read",
            "profile.update"
        ],
        "is_superadmin": true
    }
}