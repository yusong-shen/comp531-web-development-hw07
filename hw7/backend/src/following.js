/**
 * Created by yusong on 10/25/16.
 */



const Profile = require('./model.js').Profile
const getProfile = require('./profile').getProfile
const updateProfile = require('./profile').updateProfile
const getField = require('./profile').getField



// DELETE /following/:user
const deleteFollowing = (req, res) => {
    const user = req.username
    const toDeleteUser = req.params.user
    console.log(`delete ${toDeleteUser}`)
    // return the original following if add following failed
    // get the original following list first
    getProfile(user, function (err, originalProfile) {
        if (!err) {
            // console.log(originalProfile)
            if (originalProfile.length === 0) {
                res.send(404, `can't find the user ${user}`)
            } else {
                const oldFollowings = { username : user}
                oldFollowings.following = originalProfile[0].following

                // delete the require user from list
                const query = {
                    username : user
                }
                const update = {"$pull" : { following : toDeleteUser}}
                updateProfile(query, update, function (err, doc) {
                    if (!err) {
                        if (doc.length === 0) {
                            res.send(oldFollowings)
                        } else {
                            const result = {}
                            result.username = user
                            result.following = doc.following
                            res.send(result)
                        }
                    } else {
                        res.send(oldFollowings)
                    }
                }, {new: true})

            }
        } else {
            res.send(404, err)
        }
    })
}

const addFollowing = (req, res) => {
    const user = req.username
    const toAddUser = req.params.user
    // return the original following if add following failed
    // get the original following list first
    getProfile(user, function (err, originalProfile) {
        if (!err) {
            if (originalProfile.length === 0) {
                res.send(404, `can't find the user ${user}`)
            } else {
                const oldFollowings = { username : user}
                oldFollowings.following = originalProfile[0].following
                // can't add yourself
                if (toAddUser === user) {
                    res.send(oldFollowings)
                    return
                }
                // verify that toAddUser exist
                getProfile(toAddUser, function (err, doc) {
                    if (!err) {
                        if (doc.length === 0) {
                            res.send(oldFollowings)
                        } else {
                            // user $addToSet to ensure we can't add existed following
                            const query = {
                                username : user
                            }
                            const update = {"$addToSet" : { following : toAddUser}}
                            updateProfile(query, update, function (err, doc) {
                                if (!err) {
                                    if (doc.length === 0) {
                                        res.send(oldFollowings)
                                    } else {
                                        const result = {}
                                        result.username = user
                                        result.following = doc.following
                                        res.send(result)
                                    }
                                } else {
                                    res.send(oldFollowings)
                                }
                            }, {new: true})
                        }
                    } else {
                        res.send(oldFollowings)
                    }
                })

            }
        } else {
            res.send(404, err)
        }
    })
}

module.exports = (app) => {
    app.delete('/following/:user', deleteFollowing)
    app.put('/following/:user', addFollowing)
    app.get('/following/:user*?', getField('following'))
}