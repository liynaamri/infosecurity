const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
app.use(express.json())
app.get('/', (req, res) => {
 res.send('Attendance management System')
})
app.get('/attendance', (req, res) => {
 res.send('Attendance Submitted')
})
app.get('/subject', (req, res) => {
 res.send('Subject added succesfully')
})
app.get('/lecturer', (req, res) => {
 res.send('Lecturer')
})
app.get('/register', (req, res) => {
 res.send('Register Successfully')
})
app.get('/login', (req, res) => {
    res.send('Login Successfully')
})
app.get('/logout', (req, res) => {
    res.send('See you next time :)')
})

app.listen(port, () => {
 console.log(`Example app listening on port ${port}`)
})