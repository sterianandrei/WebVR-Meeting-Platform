import React from 'react';
import {
    StyleSheet,
    Text,
    View, VrButton
} from 'react-360';
import { browserBridgeIndex } from "../module/BrowserBridgeIndex";

export default class Note extends React.Component<{ id: string, position: { x: number, y: number, z: number, rx: number, ry: number, rz: number }, startVisible: boolean },
    {}> {
    state = {
        position: {},
        editing: false,
        text: "Change to Note Edit button to change text",
    };
    id: string = this.props.id;

    componentWillMount(): void {
        this.setState({
            position: this.props.position
        });
        browserBridgeIndex.onEvent("changeText", data => {
					console.log("CHANGE TEXT!! -> " + data.text);
            if (data.id === this.props.id) {
                this.setState({text: data.text});
            }
        })
    }

    render() {
        return (
            <View>
                <View style={{
                    // Fill the entire surface
                    width: 0.25,
                    height: 0.25,
                    backgroundColor: 'rgba(255, 255, 0, 1)',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <VrButton style={styles.buttonNote}
                              onButtonPress={() => {
                                  browserBridgeIndex.emit("vrButtonStart", {});
                              }}
                              onButtonRelease={() => {
                                  browserBridgeIndex.emit("vrButtonStop", {});
                              }}
                              onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  console.log(event);
                                  if (this.state.editing) {
                                      this.setState({editing: false});
                                      browserBridgeIndex.emit("stopEditText", {id: this.props.id});
                                  } else {
                                      this.setState({editing: true});
                                      browserBridgeIndex.emit("startEditText", {id: this.props.id});
                                      setTimeout(() => {
                                          if (this.state.editing) {
                                              this.setState({editing: false});
                                              browserBridgeIndex.emit("stopEditText", {id: this.props.id});
                                          }
                                      }, 14000);//14s max input
                                  }
                              }}><Text style={styles.buttonTextNote}>
                        {/*"Note: "+this.props.id+"\n"*/}
                        {/*!this.state.editing ? this.state.text : "Speak and click again on the note when finished."*/}
                        {this.state.text}
                    </Text></VrButton>
                </View>
            </View>
        );
    }
};

const styles = StyleSheet.create({
    editBox: {
        flex: 1, flexDirection: 'row',
        marginTop: 0,
        marginBottom: 20,
        marginLeft: 20,
        marginRight: 20
    },
    greetingBox: {
        padding: 20,
        backgroundColor: '#000000',
        borderColor: '#639dda',
        borderWidth: 2,
    },
    buttonNote: {
        height: "100%",
        width: "100%",
    },
    buttonTextNote: {
        fontSize: 0.025,
        height: "100%",
        width: "100%",
        color: '#000000'
    },
});
