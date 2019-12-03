const initialState = { salesIDS: [] }

export const entryReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SALES:LOADED": {
      return { ...state, salesIDS: state.salesIDS.concat(action.payload) }
    }
    default:
      return state
  }
}
