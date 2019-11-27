import fetch from 'isomorphic-unfetch'


export default async (req, res) => {
  const { username, password } = await req.body
  // not sure where pass would come from
  console.log('username', username)

  // check if username and password are correct ->
  // lmk if this needs to be a function
  if (username === 'laura' && password === 'testing') {
    return res.status(200).json({success: true})
  }
  else {
    return res.status(401).json({success: false})
  }

  /*
  sale list route
  sale route
  cross origin requests -> reqs to dear need to be made from server
  /pages/api/dear/sale/(saleid) -> cache control for this 12 hours

  const url = `https://api.github.com/users/${username}`

  try {
    const response = await fetch(url)

    if (response.ok) {
      const { id } = await response.json()
      return res.status(200).json({ token: id })
    } else {
      // https://github.com/developit/unfetch#caveats
      const error = new Error(response.statusText)
      error.response = response
      throw error
    }
  } catch (error) {
    const { response } = error
    return response
      ? res.status(response.status).json({ message: response.statusText })
      : res.status(400).json({ message: error.message })
  }
  */
}
