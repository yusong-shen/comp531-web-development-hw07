////////////////////////////////
// Upload files to Cloudinary //
////////////////////////////////
const multer = require('multer')
const stream = require('stream')
const cloudinary = require('cloudinary')

if (!process.env.CLOUDINARY_URL) {
     process.env.CLOUDINARY_URL="cloudinary://365686241836513:d5_fD-24mTt6KFlYL7osaIaEDLg@hmzohj0ob"
}

const doUpload = (publicName, req, res, next) => {

	const uploadStream = cloudinary.uploader.upload_stream(result => {    	
         // capture the url and public_id and add to the request
         req.fileurl = result.url
         req.fileid = result.public_id
         next()
	}, { public_id: req.body[publicName]})

	// multer can save the file locally if we want
	// instead of saving locally, we keep the file in memory
	// multer provides req.file and within that is the byte buffer

	// we create a passthrough stream to pipe the buffer
	// to the uploadStream function for cloudinary.
	const s = new stream.PassThrough()
	s.end(req.file.buffer)
	s.pipe(uploadStream)
	s.on('end', uploadStream.end)
	// and the end of the buffer we tell cloudinary to end the upload.
}

// multer parses multipart form data.  Here we tell
// it to expect a single file upload named 'image'
// Read this function carefully so you understand
// what it is doing!
const uploadImage = (publicName) => (req, res, next) =>
     multer().single('image')(req, res, () => 
               doUpload(publicName, req, res, next))


// remove the above three functions and change the last line below to
//     module.exports = uploadImage
// 
// then to use in profile.js do (see comment in getImage about the string 'avatar')
//     const uploadImage = require('./uploadCloudinary')
//     app.post('/avatar', uploadImage('avatar'), uploadAvatar)
//
///////////////////////////////////////////////////////////////////////////////


module.exports = {
    doUpload,
	uploadImage
}