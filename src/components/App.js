import React from 'react';
import Auth from '@aws-amplify/auth';

import awsconfig from '../../awsexports'

// retrieve temporary AWS credentials and sign requests
Auth.configure(awsconfig);

import Navigation from './Navigation'
import Dropdown from 'react-bootstrap/Dropdown'
import DropdownButton from 'react-bootstrap/DropdownButton'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Spinner from 'react-bootstrap/Spinner'
import Header from './Header';
import GamesList from './GamesList';
import Game from './Game';
import LoginModal from './LoginModal';
import Weeks from './Weeks';
import * as api from '../api';
import { APIClass } from 'aws-amplify';

const pushState = (obj, url) =>
  window.history.pushState(obj, '', url);

const onPopState = handler => {
  window.onpopstate = handler;
};

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      ...this.props.initialData,
      sport: 'nfl',
      gamePredictions: {},
      fetchingData: false,
      loginModalShow: false,
      confirmUser: false,
      authState: 'checkingSignIn'
    }
    
  }
  
  
  async componentDidMount() {
    // timers, listeners
    onPopState((event) => {
      this.setState({
        currentGameId: (event.state || {}).currentGameId
      });
    });
    console.log('this.state: ', this.state)

    let fbUser = this.state.code ? await api.getFacebookUser(this.state.code) : null
    try {
      let user = await Auth.currentAuthenticatedUser()
      this.setState({user, authState: 'signedIn'})
    } catch(userError) {
      this.setState({user: null, authState: 'signIn'})
    }

    if (!this.state.currentGameId) {
      this.setState({ fetchingGames: true })
      api.getUserSession(userSession => {
        api.fetchGameWeek(this.state.sport, userSession)
        .then(gameWeekDataResponse => {
          console.log('this.state: ', this.state)
          // console.log('gameWeekDataResponse: ', gameWeekDataResponse)
          const { sport, year, week, season, weeks } = this.state ? this.state : gameWeekDataResponse.gameWeekData;
          api.fetchGameWeekGames(sport, year, season, week, userSession)
          .then(games => {
            this.setState({
              sport: 'nfl',
              year: year,
              gameWeek: week,
              season: season,
              weeks: weeks,
              currentGameId: null,
              data: games,
              games: games,
              fetchingGames: false
            });
          });
        })
        .catch(gameWeekDataError => console.log('gameWeekDataError: ', gameWeekDataError))
      })
    }
  }
  componentDidUpdate(prevProps, prevState) {
    console.log('this.state: ', this.state)
    console.log('prevState: ', prevState)

    if (prevState.user !== this.state.user) {
      // console.log('app line 75')
      
      this.fetchGameWeekGames(this.state.sport, this.state.year, this.state.season, this.state.gameWeek ? this.state.gameWeek : this.state.week)
    }
    if (prevState.games !== this.state.games) {

    }
    if (prevState.year !== this.state.year) {
      // console.log('app line 79')
      //this.fetchGameWeekGames(this.state.year, this.state.gameWeek)
      
    }
  }
  componentWillUnmount() {
    // clean timers, listeners
    onPopState(null);
  }

  confirmUser = (e) => {
    e.preventDefault();
    const { confirmUserCode, username } = this.state;
    Auth.confirmSignUp(username, confirmUserCode)
    .then((confirmResponse) => {
      console.log('confirmResponse: ', confirmResponse)
    })
    .catch((confirmReject) => {
      console.log('confirmReject: ', confirmReject)
    })
  }

  resendConfirmation = (e) => {
    e.preventDefault();
    Auth.resendSignUp()
    .then(resendSignUpResponse => {
      console.log('resendSignUpResponse: ', resendSignUpResponse)
    })
    .catch(resendSignUpReject => {
      console.log('resendSignUpReject: ', resendSignUpReject)
    })
  }

  signIn = (e) => {
     e.preventDefault()
    const { username, password } = this.state;
    let user = Auth.signIn(username, password)
    .then(user => {
      console.log('user: ', user)
      this.setState({user, authState: 'signedIn'})
      return user;
    })
    .catch(signInError => {
      if (signInError.code === 'UserNotConfirmedException') {
        this.setState({ confirmUser: true })
        return;
      }
      console.log('signInError: ', signInError)

    })
  }
  signOut = (e) => {
    e.preventDefault()
    console.log('signOut clicked')
    Auth.signOut()
    .then(() => {
      this.setState({user: null, authState: 'signIn'})
    })
    .catch(signOutError => console.log('signOutError: ', signOutError))
  }

  
    // Sign up user with AWS Amplify Auth
  signUp = (e) => {
      e.preventDefault();
      const { username, password, givenName, familyName, email, emailOptIn } = this.state
      // rename variable to conform with Amplify Auth field phone attribute
      var attributes = {
        email: email,
        given_name: givenName,
        family_name: familyName
      }
      attributes['custom:reminderMailOptIn'] = emailOptIn ? '1' : '0'
      Auth.signUp({
          username,
          password,
          attributes
        })
        .then((response) => {
          this.setState({
            user: response.user,
            confirmUser: true
          })
        })
        .catch(err => {
        if (! err.message) {
            console.log('Error when signing up: ', err)
            // Alert.alert('Error when signing up: ', err)
        } else {
            console.log('Error when signing up: ', err, '; ', err.message)
            // Alert.alert('Error when signing up: ', err.message)
        }
      })
  }

  handleFBCode = () => {

  }

  handleLoginClick = () => {
    // return <LoginModal show={true} signInClick={this.signIn} signUpClick={this.signUp} />
    this.setState({ loginModalShow: true})
  }

  handleLoginModalClosed = () => {
    this.setState({ loginModalShow: false })
  }

  onChangeText = (event) => {
    this.setState({[event.target.name]: event.target.value})
  }

  onYearChange = (year) => {
    const season = (parseInt(year) === 2017 || parseInt(year) === 2018) ? 'reg' : 'pre'
    this.setState({ fetchingGames: true })
    this.fetchGameWeekGames(this.state.sport, parseInt(year), season, 1)
  }
  
  onChangeGameScore = (gameId, event) => {
    const gamePredictions = this.state.gamePredictions
    gamePredictions[gameId] ? gamePredictions[gameId][event.target.name] = event.target.value : gamePredictions[gameId] = { [event.target.name]: event.target.value }
    this.setState({ 
      gamePredictions: { 
        ...gamePredictions 
      }
    })
  }

  submitPrediction = (gameId) => {
    console.log(`game: ${gameId}`)
    api.getUserSession(userSession => {
      if (!userSession) {
        console.log('no user session')
        return { errorMessage: 'Please log in again and resubmit.' }
      }
      const game = this.state.games[gameId]
      const awayTeamScore = parseInt(this.state.gamePredictions[gameId].predictionAwayTeamScore)
      const homeTeamScore = parseInt(this.state.gamePredictions[gameId].predictionHomeTeamScore)
      var prediction = {
        gameId: game.gameId,
        gameWeek: game.gameWeek,
        year: game.year,
        sport: game.sport,
        season: game.season,
        awayTeam: {
          fullName: game.awayTeam.fullName,
          shortName: game.awayTeam.shortName,
          code: game.awayTeam.code,
          score: awayTeamScore ? awayTeamScore : game.prediction.awayTeam.score,
        },
        homeTeam: {
          fullName: game.homeTeam.fullName,
          shortName: game.homeTeam.shortName,
          code: game.homeTeam.code,
          score: homeTeamScore ? homeTeamScore : game.prediction.homeTeam.score,
        }
      };
      console.log('prediction :', prediction);
      api.fetchSubmitPrediction(userSession, prediction)
      .then(predictionResponse => {
        const games = this.state.games;
        const data = this.state.data;
        games[game.gameId] = predictionResponse;
        data[game.gameId] = predictionResponse;
        this.setState({
          games: games,
          data: data
        })
        return predictionResponse;
      })
      .catch(predictionError => {
        return predictionError;
      })
    })
  }

  fetchGameWeek = () => {
    api.getUserSession(userSession => {
      api.fetchGameWeek(this.state.sport, userSession)
      .then(gameWeekData => {
        console.log('app 141 gameWeekData: ', gameWeekData)
        return api.fetchGameWeekGames(gameWeekData.sport, gameWeekData.year, gameWeekData.week, userSession).then(games => games);
      })
      .catch(gameWeekDataError => console.log('gameWeekDataError: ', gameWeekDataError))
    })
  }

  fetchGame = (sport, year, season, gameWeek, gameId) => {
    pushState(
      { currentGameId: gameId },
      `/${sport}/games/${year}/${season}/${gameWeek}/${gameId}`
    );
    api.getUserSession(userSession => {
      api.fetchGame(sport, year, season, gameWeek, gameId, userSession)
      .then(game => {
        this.setState({
          pageHeader: gameId,
          currentGameId: gameId,
          data: {
            ...this.state.games,
            [game.gameId]: game
          }
        });
      })
      .catch(fetchGameError => console.log('App 115 fetchGameError: ', fetchGameError))
    });
  }

  fetchGamesList = () => {
    pushState(
      {currentGameId: null},
      '/'
    );

    api.getUserSession(userSession => {
      api.fetchGamesList(userSession)
      .then(games => {
        this.setState({
          currentGameId: null,
          data: {
            ...this.state.games,
            games
          }
        });
      })
    });
  }

  fetchGameWeekGames = (sport, year, season, gameWeek) => {
    this.setState({ fetchingGames: true })
    pushState(
      {
        currentGameId: null,
        gameWeek: gameWeek,
        year: year
      },
      `/${sport}/games/${year}/${season}/${gameWeek}`
    );
    api.getUserSession(userSession => {
      api.fetchGameWeekGames(sport, year, season, gameWeek, userSession).then((games) => {
        console.log('games: ', games)
        this.setState({
          year: year,
          gameWeek: gameWeek,
          currentGameId: null,
          data: games,
          games: games,
          fetchingGames: false
        });
      });
    })
  }

  currentGame() {
    return this.state.games ? this.state.games[this.state.currentGameId] : this.state.game;
  }
  pageHeader() {
    //console.log('this.state: ', this.state);
    if (this.state.currentGameId) {
      return this.currentGame().awayTeam.shortName + ' vs. ' + this.currentGame().homeTeam.shortName;
    }
    return `Week ${this.state.gameWeek} Games`;
  }
  currentContent() {
    console.log('this.state.currentGameId: ', this.state.currentGameId)
    if (this.state.currentGameId) {
      return <Game 
      gamesListClick={this.fetchGamesList}
      onChangeGameScore={this.onChangeGameScore}
      onSubmitPrediction={this.onSubmitPrediction}
      {...this.currentGame()} />;
    }
    //console.log('this.state.games: ', this.state.games);
    return (
      <div>
        <Dropdown>
          <Dropdown.Toggle variant="success" id="dropdown-basic">
            Select a Season
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item onClick={() => this.onYearChange(2019)} href='#' className='yearDropdown'>2019</Dropdown.Item>
            <Dropdown.Item onClick={() => this.onYearChange(2018)} href='#' className='yearDropdown'>2018</Dropdown.Item>
            <Dropdown.Item onClick={() => this.onYearChange(2017)} href='#' className='yearDropdown'>2017</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
        {/* <select onChange={(event) => this.onYearChange(event)} id="year" name="year">
          <option value="2019">2019</option>
          <option value="2018">2018</option>
          <option value="2017">2017</option>
        </select> */}
        {this.state.weeks ? (
          <Weeks
          onGameWeekClick={this.fetchGameWeekGames} currentWeek={this.state.week} sport={this.state.sport} year={this.state.year} season={this.state.season}
          weeks={this.state.weeks} />
        ) : null}
        {this.state.games ? (
        <GamesList onChangeGameScore={this.onChangeGameScore} onSubmitPrediction={this.submitPrediction} onGameClick={this.fetchGame}
        games={this.state.games} />
        ): (
          <div>No games available</div>
        )}
      </div>
    );
  }
  render() {
    return (
      <div className="App">
        <Navigation user={this.state.user} sport={this.state.sport} handleLoginClick={this.handleLoginClick} />
        <Header message={this.pageHeader()} />
        
        {(this.state.authState === 'signedIn') ? (
          <div className="row">
            {this.state.user.attributes.preferred_username}
            <Button onClick={this.signOut}>Logout</Button>
          </div>
        ) : (this.state.authState === 'signIn') ? (
          <div className="loginFields">
            {/* <form>
              <label htmlFor='username'>
                User Name:
              </label>
                <input type="text" name="username" key="username" onChange={this.onChangeText} />
              <label htmlFor='password'>
                Password:
              </label>
              <input type="password" name="password" key="password" onChange={this.onChangeText} />
              
              <Button onClick={() => this.signIn()}>Login</Button>
            </form> */}
              <LoginModal 
              onChangeText={this.onChangeText} 
              show={this.state.loginModalShow} 
              onHide={this.handleLoginModalClosed} 
              signInClick={this.signIn} 
              signUpClick={this.signUp} 
              confirmUser={this.state.confirmUser}
              handleConfirmUserClick={this.confirmUser} 
              handleResendClick={this.resendConfirmation}/>
              
              <Button onClick={() => this.handleLoginClick()}>Sign In/Sign Up</Button>
          </div>
        ) : null}
        {this.state.fetchingGames ? (
          <Spinner animation='border' />
        ) : (
        this.currentContent()
        )}
      </div>
    );
  }
}

// App.propTypes = {
//   initialGames: React.PropTypes.object
// };

export default App;
