import React, { Component } from 'react'
import Auth from '@aws-amplify/auth'
import LoginModal from './LoginModal';
import Button from 'react-bootstrap/Button'

export default class Navigation extends Component {
    constructor(props) {
        super(props)
        this.state = {
            ...this.props
        }
    }

    render() {
        return (
            <div className="row" style={{marginBottom: 100}}>
                <div className="navbar navbar-default navbar-fixed-top">
                    <div className="container">
                        <div className="header-icon"><a href="/"><img src="https://crowdsourcedscores.files.wordpress.com/2016/11/cropped-css-logo-footballleft-webres-1300px.jpg?w=520" alt="Crowd Wisdom Sports" /></a></div>
                        <div className="navbar-header"><a href="/" className="navbar-brand"><span className="hidden-md">Crowd Wisdom Sports</span><span className="visible-md">CW Sports</span></a>
                        <button type="button" data-toggle="collapse" data-target="#navbar-main" className="navbar-toggle"><span className="icon-bar"></span><span className="icon-bar"></span><span className="icon-bar"></span></button>
                        </div>
                        <div id="navbar-main" className="navbar-collapse collapse">
                            <ul className="nav navbar-nav">
                                <li><a href="#">Home</a></li>
                                <li className={this.state.sport === 'nfl' ? ('active') : ''}><a href="/">NFL</a></li>
                                <li><a href="/ncaaf">College Bowls</a></li>
                                <li><a href="/ncaam">March Madness</a></li>
                                <li><a href="https://blog.crowdsourcedscores.com/" target="blog">Blog</a></li>
                                <li><a className="dropdown-toggle" data-toggle="dropdown" href="#" id="leaderboards">Leaderboards<span className="caret"></span></a>
                                    <ul className="dropdown-menu">
                                        <li style={{textAlign: "center"}}><a href="/crowd.html"><span className="glyphicons glyphicons-group"></span> Crowds</a></li>
                                        <li style={{textAlign: "center"}}><a href="/leaderboard.html"><span><i className="glyphicon glyphicon-user"></i></span> Users</a></li>
                                    </ul>
                                </li>
                                <li style={{textAlign: "center"}}>
                                        <Button onClick={this.props.handleLoginClick}>Login/Sign Up</Button>
                                        
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
