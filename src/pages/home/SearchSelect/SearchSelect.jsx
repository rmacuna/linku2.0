import React, { useEffect, useState } from 'react'
import debounce from 'debounce-promise'

import AsyncSelect from 'react-select/async';
import { useQuery } from '@apollo/react-hooks'
import { createGlobalStyle } from 'styled-components'

import { GET_SUBJECTS_QUERY, GET_SUBJECT_GROUPS } from '../../../graphql/queries'

import SubjectsContext from '../../../context/subjects-context'

const GlobalStyles = createGlobalStyle`
  .link2-select {
    font-size: 14px;
  }
`

function SearchSelect() {
  const { loading, error, data, fetchMore } = useQuery(GET_SUBJECTS_QUERY)
  const getSubjectsQuery = useQuery(GET_SUBJECT_GROUPS, { skip: true })

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error :(</p>

  const { docs } = data.getSubjects

  const parseOptions = (docs) => docs.map(subject => ({
    label: `${subject.name} (${subject.mat})`,
    value: subject,
  }))

  return (
    <SubjectsContext.Consumer>
      {({ addSubject }) => (
        <>
          <GlobalStyles />
          <AsyncSelect
            className="link2-select"
            placeholder="Escribe la materia a buscar"
            isClearable
            isSearchable
            cacheOptions
            defaultOptions={parseOptions(docs)}
            loadOptions={debounce(inputValue => fetchMore({
              variables: {
                search: inputValue,
              },
              updateQuery: (prev, { fetchMoreResult }) => fetchMoreResult,
            }).then(({ data }) => parseOptions(data.getSubjects.docs)), 700)}
            onChange={async item => {
              if (item && item.value) {
                const { id, name, departmentName, mat } = item.value
                try {
                  const { data } = await getSubjectsQuery.refetch({
                    subjectId: id,
                  })
                  addSubject({
                    id,
                    name,
                    departmentName,
                    mat,
                    groups: data.getSubjectGroups.map((subject) => Object.assign(subject, {
                      blocked: false,
                    })),
                  })
                } catch (err) {
                  console.log('err', err)
                }
              }
            }}
          />
        </>
      )}
    </SubjectsContext.Consumer>
  )
}

export default SearchSelect
