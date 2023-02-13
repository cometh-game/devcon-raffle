import { useDebounce } from '@usedapp/core/dist/esm/src/hooks'
import { useEffect, useState } from 'react'
import { CloseButton } from 'src/components/Buttons'
import { SearchIcon } from 'src/components/Icons'
import { Colors } from 'src/styles/colors'
import styled from 'styled-components'

interface Props {
  setSearch: (search: string) => void
}

export const SearchInput = ({ setSearch }: Props) => {
  const [inputValue, setInputValue] = useState('')
  const search = useDebounce(inputValue, 500)
  useEffect(() => setSearch(search), [setSearch, search])

  return (
    <SearchInputWrapper>
      <SearchIcon />
      <StyledInput value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Search" />
      {!!inputValue && <CloseButton size={15} onClick={() => setInputValue('')} />}
    </SearchInputWrapper>
  )
}

const SearchInputWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  width: 100%;
  height: 50px;
  padding: 13px;
  margin-bottom: 8px;
  border-width: 2px;
  border-style: solid;
  border-color: ${Colors.GreenLight};
  background-color: ${Colors.White};
  transition: all 0.25s ease;

  &:hover,
  &:focus-visible,
  &:focus-within {
    border-color: ${Colors.Green};
  }
`

const StyledInput = styled.input`
  position: absolute;
  left: 0;
  top: 0;
  width: calc(100% - 45px);
  height: 100%;
  padding-left: 45px;
  border: none;
  font-family: 'Roboto', Helvetica, Arial, sans-serif;
  font-size: 16px;
  line-height: 24px;
  outline: none;
  cursor: inherit;
  color: ${Colors.Black};
  transition: all 0.25s ease;

  &,
  &:disabled {
    background-color: transparent;
  }

  &::placeholder {
    color: ${Colors.Grey};
  }
`
