15:42:14.914
200 GET
/api/admin/property/6/
251ms overall
162ms on queries
14 queries
Request Headers
CONTENT-LENGTH	
CONTENT-TYPE	text/plain
HOST	localhost:8000
CONNECTION	keep-alive
SEC-CH-UA-PLATFORM	"Windows"
USER-AGENT	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36
ACCEPT	application/json
SEC-CH-UA	"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"
SEC-CH-UA-MOBILE	?0
ORIGIN	http://localhost:5173
SEC-FETCH-SITE	same-site
SEC-FETCH-MODE	cors
SEC-FETCH-DEST	empty
REFERER	http://localhost:5173/
ACCEPT-ENCODING	gzip, deflate, br, zstd
ACCEPT-LANGUAGE	en-US,en;q=0.9,fa;q=0.8
COOKIE	********************
Response Headers
CONTENT-TYPE	application/json
ALLOW	GET, PUT, PATCH, DELETE, HEAD, OPTIONS
X-FRAME-OPTIONS	DENY
CONTENT-LENGTH	5100
VARY	origin, Cookie
ACCESS-CONTROL-ALLOW-ORIGIN	http://localhost:5173
ACCESS-CONTROL-ALLOW-CREDENTIALS	true
X-CONTENT-TYPE-OPTIONS	nosniff
X-XSS-PROTECTION	1; mode=block
REFERRER-POLICY	strict-origin-when-cross-origin
PERMISSIONS-POLICY	camera=(), microphone=(), geolocation=()
CONTENT-SECURITY-POLICY	frame-ancestors 'none'
CROSS-ORIGIN-OPENER-POLICY	same-origin
Raw Response Body
The raw response body is 5100 characters long and hence is too big to show here. Click here to view the raw response body.
Response Body
This is the body of the HTTP response represented as JSON for easier reading.
The response body is 9220 characters long and hence is too big to show here. Click here to view the response body.
Curl
Curl is a command-line utility for transferring data from servers. Paste the following into a terminal to repeat this request via command line.
curl -X GET   http://localhost:8000/api/admin/property/6/
Django Test Client
The following is working python code that makes use of the Django test client. It can be used to replicate this request from within a Django unit test, or simply as standalone Python.
from django.test import Client
c = Client()
response = c.get(path='/api/admin/property/6/',
content_type='text/plain')


15:42:14.914
200 GET
/api/admin/property/6/
251ms overall
162ms on queries
14 queries
At	Action	Tables	Num. Joins	Execution Time (ms)
+0:00:00.232733	SELECT	"real_estate_floor_plans"	0	8.068000
+0:00:00.227357	SELECT	"admin_profiles"	0	1.040000
+0:00:00.207027	SELECT	"real_estate_property_documents", "media_documents", "media_images", "media_images"	3	15.340000
+0:00:00.196746	SELECT	"real_estate_property_audios", "media_audios", "media_images", "media_images"	3	7.146000
+0:00:00.182716	SELECT	"real_estate_property_videos", "media_videos", "media_images", "media_images"	3	10.274000
+0:00:00.180160	SELECT	"media_images"	0	1.542000
+0:00:00.176792	SELECT	"real_estate_property_images"	0	1.778000
+0:00:00.168689	SELECT	"real_estate_property_images", "media_images"	1	3.513000
+0:00:00.157037	SELECT	"_prefetch_related_val_property_id", "real_estate_property_features", "real_estate_properties_features"	1	8.027000
+0:00:00.141236	SELECT	"_prefetch_related_val_property_id", "real_estate_property_tags", "real_estate_properties_tags"	1	10.082000
+0:00:00.131717	SELECT	"_prefetch_related_val_property_id", "real_estate_property_labels", "real_estate_properties_labels"	1	8.972000
+0:00:00.034727	SELECT	"real_estate_properties", "real_estate_agents", "users", "real_estate_agencies", "real_estate_agencies", "real_estate_property_types", "real_estate_property_states", "provinces", "cities", "real_estate_city_regions", "cities", "provinces", "countries"	12	84.559000
+0:00:00.018981	SELECT	"users"	0	1.086000
+0:00:00.006893	SELECT	"django_session"	0	0.539000
Page 1 of 1.