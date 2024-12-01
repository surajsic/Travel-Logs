import React from 'react'
import ProfileInfo from './Cards/ProfileInfo'
import { useNavigate } from 'react-router-dom'
import SearchBar from './input/SearchBar'

const Navbar = ({userInfo , searchQuery, setSearchQuery, onSearchNote, handleClearSearch }) => {

    const isToken = localStorage.getItem("token")
    const navigate = useNavigate()
    const onLogout =()=>{
        localStorage.clear();
        navigate("/");
    }

    const handleSearch = () => {
      if (searchQuery) {
        onSearchNote(searchQuery); 
      }
    }

    const onClearSearch =()=>{
      handleClearSearch();
      setSearchQuery("");
    }

  return (
    <>
        <div className='bg-white  items-center flex justify-between px-6 py-2 drop-shadow sticky top-0 z-10'>
            <img src="./src/assets/images/logo.png" alt='travel story'className='h-28'/>

            {isToken && <>
                
                <SearchBar 
                  value={searchQuery}
                  onChange={({ target })=> {
                    setSearchQuery(target.value)
                  }}
                  handleSearch={handleSearch}
                    onClearSearch={onClearSearch}
                     />                  
                

                  <ProfileInfo userInfo={userInfo} onLogout={onLogout}/> </>}
        </div>
    </>
  )
}

export default Navbar
