BLOG_PERMISSIONS = {
    'blog.read': {
        'module': 'blog',
        'action': 'read',
        'display_name': 'View Blogs',
        'description': 'Allow viewing blog posts list and details',
    },
    'blog.create': {
        'module': 'blog',
        'action': 'create',
        'display_name': 'Create Blog',
        'description': 'Allow creating new blog posts',
    },
    'blog.update': {
        'module': 'blog',
        'action': 'update',
        'display_name': 'Update Blog',
        'description': 'Allow updating blog posts',
    },
    'blog.delete': {
        'module': 'blog',
        'action': 'delete',
        'display_name': 'Delete Blog',
        'description': 'Allow deleting blog posts',
    },
    'blog.tag.delete': {
        'module': 'blog',
        'action': 'delete',
        'display_name': 'Delete Blog Tag',
        'description': 'Allow deleting blog tags',
    },
}
