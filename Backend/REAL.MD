200 GET
/api/admin/blog/1/
268ms overall
114ms on queries
13 queries
← 
Details 
SQL 
Profiling 
CProfile
14:37:41.128
200 GET
/api/admin/blog/1/
268ms overall
114ms on queries
13 queries
At	Action	Tables	Num. Joins	Execution Time (ms)
+0:00:00.242689	SELECT	"name", "blog_categories", "blog_listings_categories"	1	1.618000
+0:00:00.235930	SELECT	"name", "blog_tags", "blog_listings_tags"	1	1.752000
+0:00:00.159598	SELECT	"blog_documents", "media_documents", "media_images", "media_images"	3	21.436000
+0:00:00.136161	SELECT	"blog_audios", "media_audios", "media_images", "media_images"	3	18.354000
+0:00:00.111361	SELECT	"blog_videos", "media_videos", "media_images", "media_images"	3	19.764000
+0:00:00.104827	SELECT	"media_images"	0	2.044000
+0:00:00.100252	SELECT	"blog_images"	0	1.315000
+0:00:00.084803	SELECT	"blog_images", "media_images"	1	11.906000
+0:00:00.067187	SELECT	"_prefetch_related_val_blog_id", "blog_tags", "blog_listings_tags"	1	14.974000
+0:00:00.062443	SELECT	"_prefetch_related_val_blog_id", "blog_categories", "blog_listings_categories"	1	1.388000
+0:00:00.041730	SELECT	"blog_listings", "media_images"	1	16.487000
+0:00:00.026676	SELECT	"users"	0	1.669000
+0:00:00.010705	SELECT	"django_session"	0	1.117000
Page 1 of 1.
previous | next